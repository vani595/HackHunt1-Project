import { getDBConnection, getMindsDBConnection } from './database';
import { HackathonAPI } from './hackathons';

export class SourceAPI {
  static async getAllSources() {
    try {
      const db = await getMindsDBConnection();

      const query = `
        SELECT * FROM mysql_datasource.hackathon.hackathon_sources
        ORDER BY created_at DESC
      `;

      const [rows] = await db.query(query);
      return rows.map(this.transformDBRowToSource);
    } catch (error) {
      console.error('Error fetching sources:', error);
      throw new Error('Failed to fetch hackathon sources');
    }
  }

  static async createSource(source) {
    try {
      const db = await getDBConnection();

      const query = `
        INSERT INTO hackathon_sources
        (name, url, provider, is_active, created_by, created_at)
        VALUES (?, ?, ?, ?, 'admin', NOW())
      `;

      const [result] = await db.execute(query, [
        source.name,
        source.url,
        source.provider,
        source.isActive
      ]);

      const insertId = result.insertId;

      return {
        id: insertId.toString(),
        name: source.name,
        url: source.url,
        provider: source.provider,
        isActive: source.isActive,
        hackathonsCount: 0
      };
    } catch (error) {
      console.error('Error creating source:', error);
      throw new Error('Failed to create hackathon source');
    }
  }

  static async updateSource(provider, updates) {
    try {
      const db = await getDBConnection();

      const fields = [];
      const values = [];

      if (updates.name !== undefined) {
        fields.push('name = ?');
        values.push(updates.name);
      }

      if (updates.url !== undefined) {
        fields.push('url = ?');
        values.push(updates.url);
      }

      if (updates.provider !== undefined) {
        fields.push('provider = ?');
        values.push(updates.provider);
      }

      if (updates.isActive !== undefined) {
        fields.push('is_active = ?');
        values.push(updates.isActive);
      }

      if (fields.length === 0) return;

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(provider);

      const query = `
        UPDATE hackathon_sources
        SET ${fields.join(', ')}
        WHERE provider = ?
      `;

      await db.execute(query, values);
    } catch (error) {
      console.error('Error updating source:', error);
      throw new Error('Failed to update hackathon source');
    }
  }

  static async deleteSource(provider) {
    try {
      const db = await getMindsDBConnection();

      const query = `
        DELETE FROM mysql_datasource.hackathon.hackathon_sources
        WHERE provider = ?
      `;
      await db.execute(query, [provider]);
    } catch (error) {
      console.error('Error deleting source:', error);
      throw new Error('Failed to delete hackathon source');
    }
  }

  static async fetchFromSource(id) {
    try {
      const db = await getDBConnection();

      const sourceQuery = `
        SELECT * FROM hackathon_sources WHERE provider = ?
      `;
      const [sourceRows] = await db.query(sourceQuery, [id]);

      if (sourceRows.length === 0) {
        throw new Error('Source not found');
      }

      const source = sourceRows[0];

      const fetchedCount =
        await HackathonAPI.fetchAndStoreHackathons(
          source.url,
          source.provider
        );

      const updateQuery = `
        UPDATE hackathon_sources
        SET last_fetched = CURRENT_TIMESTAMP,
            hackathons_count = ?
        WHERE provider = ?
      `;

      await db.execute(updateQuery, [fetchedCount, id]);

      return {
        success: true,
        count: fetchedCount || 0,
        message: `Successfully fetched ${fetchedCount} hackathons from ${source.name}`
      };
    } catch (error) {
      console.error('Error fetching from source:', error);
      return {
        success: false,
        count: 0,
        message: `Failed to fetch from source: ${error.message}`
      };
    }
  }

  static transformDBRowToSource(row) {
    return {
      name: row.name,
      url: row.url,
      provider: row.provider,
      isActive: Boolean(row.is_active),
      lastFetched: row.last_fetched
        ? row.last_fetched.toISOString()
        : undefined,
      hackathonsCount: row.hackathons_count || 0
    };
  }
}
