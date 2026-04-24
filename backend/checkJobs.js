const mongoose = require('mongoose');
const Job = require('./src/models/Job');
require('dotenv').config();

async function checkJobs() {
  await mongoose.connect(process.env.MONGODB_URI);
  const jobs = await Job.find().sort({ createdAt: -1 }).limit(3);
  jobs.forEach(j => {
    console.log(`Job ID: ${j._id}, Status: ${j.status}`);
    if (j.errorMessage) console.log(`Error: ${j.errorMessage}`);
  });
  mongoose.disconnect();
}
checkJobs();
