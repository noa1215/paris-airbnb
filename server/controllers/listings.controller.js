// Controller for /api/listings - reads req.query / req.params, validates, calls the DAL,
// sets the status code and sends JSON. No SQL here.
const listingsDal = require('../dal/listings.dal');

function parseNonNegativeNumber(value) {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

async function getListings(req, res) {
  const { neighbourhood, roomType, minPrice, maxPrice, sort, limit, minRating } = req.query;

  if (neighbourhood !== undefined && typeof neighbourhood !== "string") {
    return res.status(400).json({ error: "neighbourhood must be a string" });
  }
  if (roomType !== undefined && typeof roomType !== "string") {
    return res.status(400).json({ error: "roomType must be a string" });
  }

  let parsedMinPrice;
  if (minPrice !== undefined) {
    parsedMinPrice = parseNonNegativeNumber(minPrice);
    if (parsedMinPrice === null) {
      return res.status(400).json({ error: "minPrice must be a non-negative number" });
    }
  }

  let parsedMaxPrice;
  if (maxPrice !== undefined) {
    parsedMaxPrice = parseNonNegativeNumber(maxPrice);
    if (parsedMaxPrice === null) {
      return res.status(400).json({ error: "maxPrice must be a non-negative number" });
    }
  }

  let parsedLimit = 20;
  if (limit !== undefined) {
    if (typeof limit !== "string" || !/^\d+$/.test(limit.trim()) || Number(limit) < 1) {
      return res.status(400).json({ error: "limit must be a whole number from 1 to 50" });
    }
    parsedLimit = Math.min(Number(limit), 50);
  }

  let parsedMinRating;
  if (minRating !== undefined) {
    parsedMinRating = parseNonNegativeNumber(minRating);
    if (parsedMinRating === null || parsedMinRating > 5) {
      return res.status(400).json({ error: "minRating must be a number from 0 to 5" });
    }
  }

  const selectedSort = sort === undefined ? "price" : sort;
  if (selectedSort !== "price" && selectedSort !== "rating") {
    return res.status(400).json({ error: 'sort must be "price" or "rating"' });
  }

  const filters = {
    neighbourhood,
    roomType,
    minPrice: parsedMinPrice,
    maxPrice: parsedMaxPrice,
    minRating: parsedMinRating,
    limit: parsedLimit,
    orderBy: selectedSort === "rating"
      ? "review_scores_rating DESC"
      : "price ASC",
  };

  try {
    const listings = await listingsDal.getListings(filters);
    return res.json(listings);
  } catch (error) {
    console.error("Failed to fetch listings:", error);
    return res.status(500).json({ error: "Failed to fetch listings" });
  }
}


// Step 3: getListingById(req, res)
//   - id is not a number -> 400, no such id -> 404
//   - convert hostIsSuperhost 't' / 'f' to true / false
//
// Every controller: try/catch -> 500 { error } when the DAL throws.


function parseAmenities(value) {
  if (typeof value !== "string" || value === "{}") return [];
  const inner = value.replace(/^\{|\}$/g, "");
  const result = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < inner.length; i++) {
    const char = inner[i];
    if (char === '"' && inner[i - 1] !== "\\") quoted = !quoted;
    else if (char === "," && !quoted) {
      result.push(current.trim().replace(/^"|"$/g, "").trim());
      current = "";
    } else current += char;
  }
  if (current.trim()) result.push(current.trim().replace(/^"|"$/g, "").trim());
  return result;
}

async function getListingById(req, res) {
  const rawId = req.params.id;
  if (!/^\d+$/.test(rawId)) {
    return res.status(400).json({ error: "id must be a number" });
  }

  try {
    const row = await listingsDal.getListingById(Number(rawId));
    if (!row) return res.status(404).json({ error: "Listing not found" });

    row.hostIsSuperhost = row.hostIsSuperhostRaw === "t";
    delete row.hostIsSuperhostRaw;
    row.amenities = parseAmenities(row.amenitiesRaw);
    delete row.amenitiesRaw;
    return res.json(row);
  } catch (error) {
    console.error("Failed to fetch listing:", error);
    return res.status(500).json({ error: "Failed to fetch listing" });
  }
}

module.exports = { getListings, getListingById };
