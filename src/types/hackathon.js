/**
 * @typedef {"upcoming"|"ongoing"|"ended"|"active"|"open"} HackathonStatus
 */

/**
 * @typedef {"online"|"hybrid"|"in-person"} HackathonType
 */

/**
 * @typedef {Object} Hackathon
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} totalPrize
 * @property {string} startDate
 * @property {string} endDate
 * @property {string} registrationUrl
 * @property {string} imageUrl
 * @property {string} organizer
 * @property {string} location
 * @property {HackathonType} type
 * @property {HackathonStatus} status
 * @property {string[]} tags
 * @property {number=} participants
 * @property {number=} maxParticipants
 */

export {};
