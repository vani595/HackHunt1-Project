import {
  closeDBConnection,
  getDBConnection,
  getMindsDBConnection,
  closeMindsDBConnection
} from './database';

import { parseHackathons } from '../server/processor/topcoderHackathon';
import { parseHackathons as parseDevpostHackathons } from '../server/processor/devpostHackathon';
import { parseHackathons as parseQuiraHackathons } from '../server/processor/quiraHackathon';
import { fetchHackathonData } from './fetcher';
import {
  getTodayDate,
  jsonToWhereClause,
  parseJsonFromMarkdown
} from '../utils/stringUtils';

export class HackathonAPI {
  static async getAllHackathons(filters = {}) {
    try {
      const db = await getMindsDBConnection();

      let query = `
        SELECT h.*
        FROM mysql_datasource.hackathon.hackathons h
        WHERE 1=1
      `;

      const params = [];

      // Search filter
      if (filters.search) {
        query += ` AND (h.title LIKE ? OR h.description LIKE ? OR JSON_SEARCH(h.tags, 'one', ?) IS NOT NULL)`;
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, `%${filters.search}%`);
      }

      // Status filter
      if (filters.status) {
        if (filters.status === 'ongoing') {
          query += ` AND (h.status = ? OR h.status = ? OR h.status = ?)`;
          params.push(filters.status, 'active', 'open');
        } else {
          query += ` AND h.status = ?`;
          params.push(filters.status);
        }
      }

      // Type filter
      if (filters.type) {
        query += ` AND h.type = ?`;
        params.push(filters.type);
      }

      query += ` AND h.end_date >= NOW()`;
      query += ` ORDER BY h.start_date ASC, h.created_at DESC`;

      // Pagination
      if (filters.limit) {
        query += ` LIMIT ?`;
        params.push(filters.limit);

        if (filters.offset) {
          query += ` OFFSET ?`;
          params.push(filters.offset);
        }
      }

      const [rows] = await db.query(query, params);
      const hackathons = rows.map(this.transformDBRowToHackathon);

      // Count query
      let countQuery = `
        SELECT COUNT(*) as total
        FROM mysql_datasource.hackathon.hackathons h
        WHERE 1=1
      `;

      const countParams = [];

      if (filters.search) {
        countQuery += ` AND (h.title LIKE ? OR h.description LIKE ? OR JSON_SEARCH(h.tags, 'one', ?) IS NOT NULL)`;
        const searchTerm = `%${filters.search}%`;
        countParams.push(searchTerm, searchTerm, `%${filters.search}%`);
      }

      if (filters.status) {
        if (filters.status === 'ongoing') {
          countQuery += ` AND (h.status = ? OR h.status = ? OR h.status = ?)`;
          countParams.push(filters.status, 'active', 'open');
        } else {
          countQuery += ` AND h.status = ?`;
          countParams.push(filters.status);
        }
      }

      if (filters.type) {
        countQuery += ` AND h.type = ?`;
        countParams.push(filters.type);
      }

      countQuery += ` AND h.end_date >= NOW()`;

      const [countResult] = await db.query(countQuery, countParams);
      const total = countResult[0].total;

      return { hackathons, total };
    } catch (error) {
      console.error('Error fetching hackathons:', error);
      throw new Error('Failed to fetch hackathons');
    }
  }

  static async getHackathonById(id) {
    try {
      const db = await getMindsDBConnection();

      const query = `
        SELECT h.*
        FROM mysql_datasource.hackathon.hackathons h
        WHERE h.external_id = ?
      `;

      const [rows] = await db.query(query, [id]);

      if (rows.length === 0) {
        return null;
      }

      return this.transformDBRowToHackathon(rows[0]);
    } catch (error) {
      console.error('Error fetching hackathon by ID:', error);
      throw new Error('Failed to fetch hackathon details');
    }
  }

  static async getHackathonStats() {
    try {
      const db = await getMindsDBConnection();

      const statsQuery = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'upcoming' THEN 1 ELSE 0 END) as upcoming,
          SUM(CASE WHEN status = 'ongoing' OR status = 'active' OR status = 'open' THEN 1 ELSE 0 END) as ongoing,
          SUM(CASE WHEN status = 'ended' THEN 1 ELSE 0 END) as ended
        FROM mysql_datasource.hackathon.hackathons
      `;

      const [statsResult] = await db.query(statsQuery);
      const stats = statsResult[0];

      const prizeQuery = `
        SELECT total_prize
        FROM mysql_datasource.hackathon.hackathons
        WHERE total_prize IS NOT NULL AND total_prize != ''
      `;

      const [prizeResult] = await db.query(prizeQuery);

      let totalPrizeAmount = 0;
      prizeResult.forEach(row => {
        const matches = row.total_prize.match(/\$?([\d,]+)/);
        if (matches) {
          totalPrizeAmount += parseInt(matches[1].replace(/,/g, ''));
        }
      });

      return {
        total: stats.total,
        upcoming: stats.upcoming,
        ongoing: stats.ongoing,
        ended: stats.ended,
        totalPrize: `$${totalPrizeAmount.toLocaleString()}`
      };
    } catch (error) {
      console.error('Error fetching hackathon stats:', error);
      throw new Error('Failed to fetch hackathon statistics');
    }
  }

  static transformDBRowToHackathon(row) {
    return {
      id: row.external_id.toString(),
      title: row.title,
      description: row.description || '',
      totalPrize: row.total_prize || '',
      startDate: row.start_date,
      endDate: row.end_date,
      registrationUrl: row.registration_url || '',
      imageUrl: row.image_url,
      organizer: row.organizer || '',
      location: row.location || '',
      type: row.type || 'online',
      tags: row.tags ? row.tags : [],
      status: row.status || 'upcoming'
    };
  }

  static async fetchAndStoreHackathons(url, sourceName) {
    const jsonData = await fetchHackathonData(url);
    if (jsonData.length === 0) return 0;

    let hackathons = [];

    if (sourceName === 'topcoder') {
      hackathons = await parseHackathons(jsonData);
    } else if (sourceName === 'devpost') {
      hackathons = await parseDevpostHackathons(jsonData);
    } else if (sourceName === 'quira') {
      hackathons = parseQuiraHackathons(jsonData);
    }

    const connection = await getDBConnection();
    let processedHackathonCount = 0;

    try {
      for (const hackathon of hackathons) {
        const [existing] = await connection.query(
          "SELECT external_id FROM hackathons WHERE external_id = '" +
            hackathon.id +
            "' AND source_name = '" +
            sourceName +
            "'"
        );

        if (existing.length > 0) continue;

        await connection.execute(
          `INSERT INTO hackathons
          (external_id, title, description, total_prize, start_date, end_date,
           registration_url, image_url, organizer, location, type, tags, status,
           source_name, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            hackathon.id,
            hackathon.title,
            hackathon.description,
            hackathon.totalPrize,
            hackathon.startDate,
            hackathon.endDate,
            hackathon.registrationUrl,
            hackathon.imageUrl,
            hackathon.organizer,
            hackathon.location,
            hackathon.type,
            JSON.stringify(hackathon.tags),
            hackathon.status,
            sourceName
          ]
        );

        processedHackathonCount++;
      }

      return processedHackathonCount;
    } catch (error) {
      console.error('Error inserting hackathons:', error);
    }
  }

  static async chatWithBot(message, conversationHistory = []) {
    try {
      const db = await getMindsDBConnection();

      const metadataQuery =
        'SELECT metadata from metadata_generation_model where question = ? and today = ?';

      const [rows] = await db.query(metadataQuery, [
        message,
        getTodayDate()
      ]);

      let metadata = {};
      if (rows.length > 0 && rows[0].metadata) {
        metadata = parseJsonFromMarkdown(rows[0].metadata);
      }

      const { whereClause, params } = jsonToWhereClause(metadata, 'AND');
      params.push(message);

      const kbQuery =
        'SELECT * from hack_kb WHERE ' + whereClause + ' content LIKE ? LIMIT 7';

      const [kbRows] = await db.query(kbQuery, params);

      if (kbRows.length > 0) {
        const hackathonsList = kbRows.map(h => ({
          metadata: h.metadata,
          content: h.chunk_content,
          id: h.id
        }));

        const chatQuery =
          'SELECT response from chat_generation_model WHERE information = ? and question = ? and today = ?';

        const [responseRows] = await db.query(chatQuery, [
          JSON.stringify(hackathonsList),
          message,
          getTodayDate()
        ]);

        return `${responseRows[0].response}\n\nAnything else you want to ask ?`;
      }

      return `I can't find any hackathon based on your questions, please ask another question.`;
    } catch (error) {
      console.error('Error in chatbot:', error);
      return `Sorry, I'm having trouble accessing the hackathon database right now. Please try again later.`;
    }
  }
}
