const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const router = require('./routes');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (request, response) => response.status(200).json({ status: 'ok' }));
app.use('/api', router);

app.use((request, response) => {
  response.status(404).json({ error: 'Route not found' });
});

app.use((error, request, response, next) => {
  console.error('Unhandled server error:', error.message);
  response.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => console.log(`TrustMesh backend listening on port ${port}`));
}

module.exports = app;