VanillaTilt.init(document.querySelectorAll(".card"), {
    max: 15,
    speed: 400,
    glare: true,
    "max-glare": .5
});



const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");


function isPointInPolygon(p, q) {
  function isPointOnSegment(x1, y1, x2, y2, px, py) {
    let crossProduct = (py - y1) * (x2 - x1) - (px - x1) * (y2 - y1);
    if (Math.abs(crossProduct) > 1e-10) return false; // نقطه باید دقیقا روی خط باشد

    let dotProduct = (px - x1) * (x2 - x1) + (py - y1) * (y2 - y1);
    if (dotProduct < 0) return false;

    let squaredLength = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (dotProduct > squaredLength) return false;

    return true;
  }

  function isPointOnEdge(polygon, q) {
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let { x: x1, y: y1 } = polygon[i];
        let { x: x2, y: y2 } = polygon[j];

        // بررسی اگر q روی خط بین (x1, y1) و (x2, y2) باشد
        if (isPointOnSegment(x1, y1, x2, y2, q.x, q.y)) {
            return true;
        }
    }
    return false;
  }

  if (isPointOnEdge(p, q)) return false; // اگر روی ضلع باشد، false برگرداند

  // متغیر برای نگهداری وضعیت داخل یا خارج بودن نقطه
  let inside = false;
  
  // پیمایش از اولین رأس تا آخرین رأس، با نگهداری رأس قبلی به عنوان j
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    // مختصات رأس i و رأس j
    let xi = p[i].x, yi = p[i].y;
    let xj = p[j].x, yj = p[j].y;
    
    // بررسی اینکه نقطه q در محدوده عمودی بین yi و yj قرار دارد
    // و بررسی نقطه تقاطع شعاع افقی از q با ضلع چندضلعی
    let intersect = ((yi > q.y) !== (yj > q.y)) &&
                    (q.x < (xj - xi) * (q.y - yi) / (yj - yi) + xi);
    
    // اگر تقاطع وجود داشته باشد، وضعیت inside را تغییر می‌دهیم
    if (intersect) inside = !inside;
  }
  
  // در نهایت اگر inside true باشد، نقطه داخل چندضلعی است؛ در غیر این صورت خارج است.
  return inside;
}


function parsePolygonInput(input) {
  return input.split(" ").map(point => {
    let [x, y] = point.split(",").map(Number);
    return { x, y };
  }).filter(p => !isNaN(p.x) && !isNaN(p.y));
}

function parsePointInput(input) {
  if (!input.trim()) return null; // اگر ورودی خالی بود، نقطه‌ای در نظر نگیریم
  let [x, y] = input.split(",").map(Number);
  return isNaN(x) || isNaN(y) ? null : { x, y };
}

function getBoundingBox(polygon, point) {
  let minX = Math.min(...polygon.map(p => p.x), point?.x ?? Infinity);
  let minY = Math.min(...polygon.map(p => p.y), point?.y ?? Infinity);
  let maxX = Math.max(...polygon.map(p => p.x), point?.x ?? -Infinity);
  let maxY = Math.max(...polygon.map(p => p.y), point?.y ?? -Infinity);
  return { minX, minY, maxX, maxY };
}

function normalizeShapes(polygon, point, canvasWidth, canvasHeight) {
  let { minX, minY, maxX, maxY } = getBoundingBox(polygon, point);
  let scaleX = canvasWidth / (maxX - minX);
  let scaleY = canvasHeight / (maxY - minY);
  let scale = Math.min(scaleX, scaleY) * 0.8;

  let normalizedPolygon = polygon.map(p => ({
    x: (p.x - minX) * scale + (canvasWidth * 0.1),
    y: (p.y - minY) * scale + (canvasHeight * 0.1)
  }));

  let normalizedPoint = point ? {
    x: (point.x - minX) * scale + (canvasWidth * 0.1),
    y: (point.y - minY) * scale + (canvasHeight * 0.1)
  } : null;

  return { normalizedPolygon, normalizedPoint };
}

function drawPolygonAndPoint(ctx, polygon, point, inside) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // رسم چندضلعی
  ctx.beginPath();
  ctx.moveTo(polygon[0].x, polygon[0].y);
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i].x, polygon[i].y);
  }
  ctx.closePath();
  ctx.strokeStyle = '#C9C9C9';
  ctx.lineWidth = 2;
  ctx.stroke();

  // رسم نقطه (اگر مقدار داشته باشد)
  if (point) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = inside ? 'green' : 'red';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.stroke();
  }
}




function checkInputs() {
  let polygonInput = document.getElementById("input1").value;
  let pointInput = document.getElementById("input2").value;
  
  if(polygonInput!="") {
    let polygon = parsePolygonInput(polygonInput);
    let point = parsePointInput(pointInput);

    let inside = point ? isPointInPolygon(polygon, point) : false;
    if(inside) {
      document.getElementById("isInBtn").classList.remove("no");
      document.getElementById("isInBtn").classList.add("yes");
      document.getElementById("isInValue").textContent = "yes";
    }
    else {
      document.getElementById("isInBtn").classList.remove("yes");
      document.getElementById("isInBtn").classList.add("no");
      document.getElementById("isInValue").textContent = "no";
    }

    // نرمال‌سازی شکل و نقطه با توجه به محدوده‌ی کلی
    let { normalizedPolygon, normalizedPoint } = normalizeShapes(polygon, point, canvas.width, canvas.height);

    drawPolygonAndPoint(ctx, normalizedPolygon, normalizedPoint, inside);
  }
  else {
    document.getElementById("isInBtn").classList.remove("no");
    document.getElementById("isInBtn").classList.remove("yes");
    document.getElementById("isInValue").textContent = "null";
  }
}



function resizeCanvas() {
  const card2 = document.querySelector('.card2');
  const canvas = document.getElementById('canvas');
  
  // گرفتن اندازه والد
  let width = card2.clientWidth;
  let height = card2.clientHeight;
  
  // تنظیم اندازه canvas مطابق با اندازه والد
  canvas.width = width;
  canvas.height = height;

  checkInputs()
}

// اجرا هنگام بارگذاری و تغییر سایز صفحه
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);
