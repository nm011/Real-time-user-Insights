const express = require('express');
const app = express();
const fetch = require('node-fetch');
const { createCanvas, registerFont } = require('canvas');
const { Chart, registerables } = require('chart.js');
const fs = require('fs');

Chart.register(...registerables);

let timestamps = [];
let counts = [];

const apiURL = 'http://127.0.0.1:8000/api/hello';

const charts = [];
const canvases = [];
const fileMaxEntries = [5000, 1000, 200, 50];
const imageWidth = 1920;
const imageHeight = 640;

for (let i = 0; i < fileMaxEntries.length; i++) {
  const canvas = createCanvas(imageWidth, imageHeight);
  const ctx = canvas.getContext('2d');
  canvases.push(canvas);

  charts.push(
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Count',
            data: [],
            backgroundColor: 'rgba(0, 0, 0, 1)',
            borderColor: 'rgba(51, 13, 239, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            type: 'linear', 
            beginAtZero: true,
          },
        },
      },
    })
  );
}

async function retrieveData() {
  try {
    const response = await fetch(apiURL);
    const data = await response.json();
    const count = data.count;
    const timestamp = new Date().toLocaleTimeString();

    timestamps.push(timestamp);
    counts.push(count);

    for (let i = 0; i < fileMaxEntries.length; i++) {
      const maxEntries = fileMaxEntries[i];
      const currentChart = charts[i];
      const currentCanvas = canvases[i];
      const currentTimestamps = timestamps.slice(-maxEntries);
      const currentCounts = counts.slice(-maxEntries);

      currentChart.data.labels = currentTimestamps;
      currentChart.data.datasets[0].data = currentCounts;
      currentChart.update();

      currentCanvas.width = imageWidth;
      currentCanvas.height = imageHeight;

      const context = currentCanvas.getContext('2d');

      context.clearRect(0, 0, currentCanvas.width, currentCanvas.height);

      currentChart.render({
        duration: 0,
        responsive: false,
        width: imageWidth,
        height: imageHeight
      });

      const image = currentCanvas.toDataURL('image/png');
      const imgBuffer = Buffer.from(image.split(',')[1], 'base64');

      fs.writeFileSync(`data_${maxEntries}.json`, JSON.stringify({ timestamps: currentTimestamps, counts: currentCounts }));
      fs.writeFileSync(`image_${maxEntries}.png`, imgBuffer);
    }
  } catch (error) {
    console.error('Error retrieving data:', error);
  }

  setTimeout(retrieveData, 100);
}

app.use(express.static('public'));

app.get('/images/:maxEntries', (req, res) => {
  const maxEntries = req.params.maxEntries;
  const imageBuffer = fs.readFileSync(`image_${maxEntries}.png`);

  res.set('Content-Type', 'image/png');
  res.send(imageBuffer);
});

app.get('/', (req, res) => {
  const dropdownOptions = fileMaxEntries.map((maxEntries) => `<option value="${maxEntries}">${maxEntries}</option>`).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Image Viewer</title>
        <style>
          #imageContainer img {
            max-width: 100%;
            max-height: 100%;
          }
        </style>
      </head>
      <body>
        <h1>Image Viewer</h1>
        <select id="imageSelect" onchange="changeImage()">
          ${dropdownOptions}
        </select>
        <div id="imageContainer"></div>
        <script>
          const imageSelect = document.getElementById('imageSelect');
          const imageContainer = document.getElementById('imageContainer');

          // Load the previously selected value from local storage
          const selectedValue = localStorage.getItem('selectedValue');
          if (selectedValue) {
            imageSelect.value = selectedValue;
            changeImage();
          }

          function changeImage() {
            const maxEntries = imageSelect.value;

            // Store the selected value in local storage
            localStorage.setItem('selectedValue', maxEntries);

            imageContainer.innerHTML = '<img src="/images/' + maxEntries + '" alt="Selected Image">';
          }
        </script>
      </body>
    </html>
  `;

  res.send(html);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
  retrieveData();
});

for (let i = 0; i < fileMaxEntries.length; i++) {
  const maxEntries = fileMaxEntries[i];

  fs.readFile(`data_${maxEntries}.json`, 'utf8', (err, data) => {
    if (!err) {
      try {
        const { timestamps: storedTimestamps, counts: storedCounts } = JSON.parse(data);
        timestamps = timestamps.concat(storedTimestamps);
        counts = counts.concat(storedCounts);
      } catch (error) {
        console.error(`Error reading data from file data_${maxEntries}.json:`, error);
      }
    }
  });
}
