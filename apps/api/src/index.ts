import 'dotenv/config';
import { app } from './app.js';

const port = Number(process.env.PORT || process.env.API_PORT || 4000);

app.listen(port, () => {
  console.log(`Dhaka Tesla Pool API listening on http://localhost:${port}`);
});
