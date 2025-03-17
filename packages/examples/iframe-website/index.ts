import { serve } from "bun";
const port = 4200;
serve({
  port: port,
  fetch(req) {
    return new Response(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Iframe Website</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #121212;
      color: #e0e0e0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: #1e1e1e;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    h1 {
      color: #bb86fc;
    }
    p {
      color: #e0e0e0;
    }
    .card {
      background-color: #2d2d2d;
      border-radius: 6px;
      padding: 15px;
      margin: 15px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .button {
      background-color: #bb86fc;
      color: #121212;
      border: none;
      padding: 10px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      margin-top: 10px;
    }
    .button:hover {
      background-color: #9d65e5;
    }
    .image-container {
      margin: 20px 0;
      text-align: center;
    }
    img {
      max-width: 100%;
      border-radius: 4px;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 0.9em;
      color: #888;
    }
  </style>
  <script src="http://localhost:42069"></script>
</head>
<body>
  <div class="container">
    <h1>Welcome to Iframe Website</h1>
    <p>This is a simple website served by Bun yo.</p>
    
    <div class="card">
      <h2>About This Project</h2>
      <p>This is a demonstration of a simple website that can be embedded in an iframe. It's built with Bun and serves static HTML content.</p>
      <button class="button">Learn More</button>
    </div>
    
    <div class="image-container">
      <img src="https://placekitten.com/600/300" alt="Sample Image">
    </div>
    
    <div class="card">
      <h2>Features</h2>
      <ul>
        <li>Fast serving with Bun</li>
        <li>Dark mode interface</li>
        <li>Responsive design</li>
        <li>Simple and clean layout</li>
      </ul>
    </div>
    
    <div class="card">
      <h2>Contact Us</h2>
      <p>Have questions about this demo?</p>
      <form>
        <input type="email" placeholder="Your email" style="width: 100%; padding: 8px; margin-bottom: 10px; background-color: #333; border: 1px solid #444; color: #e0e0e0; border-radius: 4px;">
        <textarea placeholder="Your message" style="width: 100%; padding: 8px; margin-bottom: 10px; background-color: #333; border: 1px solid #444; color: #e0e0e0; border-radius: 4px; min-height: 100px;"></textarea>
        <button class="button">Send Message</button>
      </form>
    </div>
    
    <div class="footer">
      <p>© 2023 Iframe Website Demo | Built with Bun</p>
    </div>
  </div>
</body>
</html>`,
      {
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  },
});

console.log(`Server running at http://localhost:${port}`);
