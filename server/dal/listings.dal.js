const { sql, poolPromise } = require("../config/db");

async function getListings(filters) {
  const pool = await poolPromise;
  const request = pool.request();
  const conditions = ["price IS NOT NULL"];

  if (filters.neighbourhood !== undefined) {
    conditions.push("neighbourhood_cleansed = @neighbourhood");
    request.input("neighbourhood", sql.NVarChar, filters.neighbourhood);
  }

  if (filters.roomType !== undefined) {
    conditions.push("room_type = @roomType");
    request.input("roomType", sql.NVarChar, filters.roomType);
  }

  if (filters.minPrice !== undefined) {
    conditions.push("price >= @minPrice");
    request.input("minPrice", sql.Float, filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    conditions.push("price <= @maxPrice");
    request.input("maxPrice", sql.Float, filters.maxPrice);
  }

  if (filters.minRating !== undefined) {
    conditions.push("review_scores_rating / 20.0 >= @minRating");
    request.input("minRating", sql.Float, filters.minRating);
  }

  request.input("limit", sql.Int, filters.limit);

  const result = await request.query(`
    SELECT TOP (@limit)
      CAST(id AS INT) AS id,
      CONCAT(room_type, ' in ', neighbourhood_cleansed) AS title,
      UPPER(property_type) AS propertyType,
      room_type AS roomType,
      neighbourhood_cleansed AS neighbourhood,
      CAST(price AS INT) AS pricePerNight,
      ROUND(review_scores_rating / 20.0, 1) AS stars,
      CAST(number_of_reviews AS INT) AS reviewsCount,
      CAST(bedrooms AS INT) AS bedrooms,
      CAST(beds AS INT) AS beds,
      CAST(accommodates AS INT) AS accommodates
    FROM dbo.Paris_Airbnb_listings
    WHERE ${conditions.join(" AND ")}
    ORDER BY ${filters.orderBy}
  `);

  return result.recordset;
}

async function getListingById(id) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("id", sql.Float, id)
    .query(`
      SELECT TOP 1
        CAST(id AS INT) AS id,
        CONCAT(room_type, ' in ', neighbourhood_cleansed) AS title,
        UPPER(property_type) AS propertyType,
        room_type AS roomType,
        neighbourhood_cleansed AS neighbourhood,
        CAST(price AS INT) AS pricePerNight,
        ROUND(review_scores_rating / 20.0, 1) AS stars,
        CAST(number_of_reviews AS INT) AS reviewsCount,
        CAST(bedrooms AS INT) AS bedrooms,
        CAST(beds AS INT) AS beds,
        CAST(accommodates AS INT) AS accommodates,
        CAST(bathrooms AS INT) AS bathrooms,
        latitude,
        longitude,
        CAST(host_id AS INT) AS hostId,
        host_name AS hostName,
        host_is_superhost AS hostIsSuperhostRaw,
        DATEADD(day, host_since - 2, '1900-01-01') AS hostSince,
        YEAR(DATEADD(day, host_since - 2, '1900-01-01')) AS hostSinceYear,
        DATEDIFF(year, DATEADD(day, host_since - 2, '1900-01-01'), GETDATE()) AS yearsHosting,
        host_about AS hostAbout,
        CASE WHEN host_about IS NULL THEN NULL ELSE CAST(LEN(host_about) AS INT) END AS aboutLength,
        amenities AS amenitiesRaw,
        CASE
          WHEN host_response_rate IS NULL THEN NULL
          ELSE CONCAT(LTRIM(RTRIM(STR(CAST(host_response_rate AS FLOAT), 5, 1))), '%')
        END AS hostResponseRate
      FROM dbo.Paris_Airbnb_listings
      WHERE id = @id
    `);
  return result.recordset[0];
}

module.exports = { getListings, getListingById };
