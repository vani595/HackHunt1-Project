/**
 * Converts a JSON string wrapped in markdown code blocks to an array
 * @param jsonString - String like "```json\n[\"item1\", \"item2\"]\n```"
 * @returns Parsed array or empty array if parsing fails
 */
export function parseJsonArrayFromMarkdown(jsonString) {
  try {
    // Remove markdown code block syntax
    const cleanedString = jsonString
      .replace(/```json\n?/g, '') // Remove opening ```json
      .replace(/```\n?/g, '')     // Remove closing ```
      .trim();                    // Remove extra whitespace

    const parsed = JSON.parse(cleanedString);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    return [];
  } catch (error) {
    console.error('Error parsing JSON Array from markdown:', error);
    return [];
  }
}

export function parseJsonFromMarkdown(jsonString) {
  try {
    const cleanedString = jsonString
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return JSON.parse(cleanedString);
  } catch (error) {
    console.error('Error parsing JSON from markdown:', error);
    return null;
  }
}

/**
 * Alternative function that handles various JSON string formats
 * @param jsonString - JSON string that might be wrapped in markdown or other formatting
 * @returns Parsed array or null if parsing fails
 */
export function parseJsonArray(jsonString) {
  try {
    let cleanedString = jsonString.trim();

    if (cleanedString.startsWith('```')) {
      cleanedString = cleanedString
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
    }

    cleanedString = cleanedString.replace(/\\"/g, '"');

    const parsed = JSON.parse(cleanedString);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    return null;
  } catch (error) {
    console.error('Error parsing JSON array:', error);
    return null;
  }
}

/**
 * Gets today's date in YYYY-MM-DD format
 * @returns Today's date as a string
 */
export function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets a specific date in YYYY-MM-DD format
 * @param date - Date object or date string
 * @returns Date as a string in YYYY-MM-DD format
 */
export function formatDateToYYYYMMDD(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts a JSON object into a WHERE clause for SQL queries
 * @param conditions - JSON object where keys are column names and values are the values to match
 * @param operator - SQL operator to use between conditions (default: 'AND')
 * @param tableAlias - Optional table alias
 * @returns Object containing WHERE clause string and parameter values array
 */
export function jsonToWhereClause(conditions, operator = 'AND', tableAlias) {
  const clauses = [];
  const params = [];

  for (const [column, value] of Object.entries(conditions)) {
    if (value !== null && value !== undefined) {
      const columnName = tableAlias ? `${tableAlias}.${column}` : column;

      if (Array.isArray(value)) {
        const placeholders = value.map(() => '?').join(', ');
        clauses.push(`${columnName} IN (${placeholders})`);
        params.push(...value);
      } else if (typeof value === 'string' && value.includes('%')) {
        clauses.push(`${columnName} LIKE ?`);
        params.push(value.toLowerCase());
      } else if (typeof value === 'object' && value.operator) {
        clauses.push(`${columnName} ${value.operator} ?`);
        params.push(value.value);
      } else {
        clauses.push(`${columnName} = ?`);
        params.push(
          typeof value === 'string' ? value.toLowerCase() : value
        );
      }
    }
  }

  const whereClause =
    clauses.length > 0 ? clauses.join(` ${operator} `) + ' AND ' : '';

  return { whereClause, params };
}

/**
 * Creates a complete SELECT query with WHERE clause from JSON conditions
 * @param tableName - Name of the table to query
 * @param conditions - JSON object with column-value pairs
 * @param columns - Array of columns to select
 * @param operator - SQL operator for WHERE clause
 * @param tableAlias - Optional table alias
 * @returns Object containing query string and parameter values array
 */
export function createSelectQuery(
  tableName,
  conditions,
  columns = ['*'],
  operator = 'AND',
  tableAlias
) {
  const { whereClause, params } = jsonToWhereClause(
    conditions,
    operator,
    tableAlias
  );

  const columnsStr = columns.join(', ');
  const aliasStr = tableAlias ? ` AS ${tableAlias}` : '';

  const query = `SELECT ${columnsStr} FROM ${tableName}${aliasStr} WHERE ${whereClause}`;

  return { query, params };
}
