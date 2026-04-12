const express = require("express");
const router = express.Router();

// Sample event data - this will later come from DynamoDB
const events = [
  {
    eventId: "1",
    title: "Nerdcore Night at The Broadberry",
    city: "Richmond",
    state: "VA",
    venue: "The Broadberry",
    startDate: "2026-05-15",
    endDate: "2026-05-15",
    performers: ["MC Hadron"],
    eventUrl: "https://example.com/event1",
    tags: ["local-show"],
    status: "approved"
  },
  {
    eventId: "2",
    title: "MAGFest Nerdcore Stage",
    city: "National Harbor",
    state: "MD",
    venue: "Gaylord National Resort",
    startDate: "2027-01-02",
    endDate: "2027-01-05",
    performers: ["MC Hadron", "The Algorithm"],
    eventUrl: "https://magfest.org",
    tags: ["festival"],
    status: "approved"
  },
  {
    eventId: "3",
    title: "VPC Round 8 Deadline",
    city: "Online",
    state: "Online",
    venue: "Online",
    startDate: "2026-06-01",
    endDate: "2026-06-01",
    performers: [],
    eventUrl: "https://example.com/vpc8",
    tags: ["vpc", "online"],
    status: "approved"
  }
];

// GET /events - return all approved events
router.get("/", (req, res) => {
  const approved = events.filter((e) => e.status === "approved");
  res.json(approved);
});

// GET /events/:id - return a single event by ID
router.get("/:id", (req, res) => {
  const event = events.find((e) => e.eventId === req.params.id);
  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }
  res.json(event);
});

module.exports = router;
