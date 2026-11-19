// Controller for /api/hosts
//
// Step 4: getHostListings(req, res)
//   - hostId is not a number -> 400, no places found -> 404
//   - try/catch -> 500 { error }

const hostsDal = require("../dal/hosts.dal");

async function getHostListings(req, res) {
  const rawHostId = req.params.hostId;
  if (!/^\d+$/.test(rawHostId)) {
    return res.status(400).json({ error: "hostId must be a number" });
  }

  try {
    const listings = await hostsDal.getListingsByHost(Number(rawHostId));
    if (listings.length === 0) {
      return res.status(404).json({ error: "Host not found" });
    }
    return res.json(listings);
  } catch (error) {
    console.error("Failed to fetch host listings:", error);
    return res.status(500).json({ error: "Failed to fetch host listings" });
  }
}

module.exports = { getHostListings };
