const express = require("express");
const router = express.Router();

// Sample artist data - this will later come from DynamoDB
const artists = [
  {
    artistId: "1",
    displayName: "MC Hadron",
    role: "vocalist",
    city: "Richmond",
    state: "VA",
    region: "Southeast",
    links: {
      soundcloud: "https://soundcloud.com/example",
      twitter: "https://twitter.com/example"
    },
    tags: ["nerdcore", "hip-hop"],
    status: "approved"
  },
  {
    artistId: "2",
    displayName: "Professor BeatBox",
    role: "producer",
    city: "Atlanta",
    state: "GA",
    region: "Southeast",
    links: {
      soundcloud: "https://soundcloud.com/example2"
    },
    tags: ["nerdcore", "chiptune"],
    status: "approved"
  },
  {
    artistId: "3",
    displayName: "The Algorithm",
    role: "both",
    city: "Chicago",
    state: "IL",
    region: "Midwest",
    links: {},
    tags: ["nerdcore", "rap"],
    status: "approved"
  }
];

// GET /artists - return all approved artists
router.get("/", (req, res) => {
  const approved = artists.filter((a) => a.status === "approved");
  res.json(approved);
});

// GET /artists/:id - return a single artist by ID
router.get("/:id", (req, res) => {
  const artist = artists.find((a) => a.artistId === req.params.id);
  if (!artist) {
    return res.status(404).json({ error: "Artist not found" });
  }
  res.json(artist);
});

module.exports = router;
