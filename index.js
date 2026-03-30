require("dotenv").config();

const express = require("express");
const axios = require("axios");
const path = require("path");


const app = express();

const PORT = process.env.PORT || 3000;
const HUBSPOT_PRIVATE_APP_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
const CUSTOM_OBJECT_TYPE = process.env.CUSTOM_OBJECT_TYPE;


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

const hubspotClient = axios.create({
  baseURL: "https://api.hubapi.com",
  headers: {
    Authorization: `Bearer ${HUBSPOT_PRIVATE_APP_TOKEN}`,
    "Content-Type": "application/json",
  },
});


async function getPlants() {
  try {
    const response = await hubspotClient.get(`/crm/v3/objects/${CUSTOM_OBJECT_TYPE}`, {
      params: {
        properties: "name,species,sunlight",
        limit: 100,
      },
    });

    return response.data.results || [];
  } catch (error) {
    console.error("Error fetching plants:", error.response?.data || error.message);
    throw error;
  }
}


app.get("/", async (req, res) => {
  try {
    const plants = await getPlants();

    res.render("homepage", {
      title: "Homepage | Integrating With HubSpot I Practicum",
      plants,
    });
  } catch (error) {
    res.status(500).send("Failed to load homepage.");
  }
});

app.get("/update-cobj", (req, res) => {
  res.render("updates", {
    title: "Update Custom Object Form | Integrating With HubSpot I Practicum",
  });
});


app.post("/update-cobj", async (req, res) => {
  const { name, species, sunlight } = req.body;

  try {
    await hubspotClient.post(`/crm/v3/objects/${CUSTOM_OBJECT_TYPE}`, {
      properties: {
        name,
        species,
        sunlight,
      },
    });

    res.redirect("/");
  } catch (error) {
    console.error("Error creating plant:", error.response?.data || error.message);
    res.status(500).send("Failed to create plant record.");
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});