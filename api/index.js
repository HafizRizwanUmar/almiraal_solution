export default function handler(req, res) {
  res.status(200).json({
    message: "Almiraal Backend is running successfully",
    status: "online",
    time: new Date().toISOString()
  });
}
