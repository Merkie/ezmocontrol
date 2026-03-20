import express from "express";
import cors from "cors";
import { uploadRouter } from "./routes/upload";
import { jobsRouter } from "./routes/jobs";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", uploadRouter);
app.use("/api", jobsRouter);

const PORT = process.env.PORT || 3720;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
