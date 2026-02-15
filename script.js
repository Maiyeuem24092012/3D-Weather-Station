/**
 * Rainbow 3D Dashboard - Thành Đạt Profile
 * Đã tối ưu xử lý AQI và fix lỗi hiển thị
 */
function init() {
    // --- 1. ĐỒNG HỒ & ĐỔI MÀU NỀN THEO GIỜ ---
    const updateTime = () => {
        const now = new Date();
        const hours = now.getHours();
        
        document.getElementById("display").innerText = now.toLocaleTimeString('vi-VN', { hour12: false });
        document.getElementById("day-of-week").innerText = now.toLocaleDateString('vi-VN', { weekday: 'long' });
        
        const day = now.getDate();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        document.getElementById("full-date").innerText = `Ngày ${day} tháng ${month} năm ${year}`;

        const body = document.body;
        if (hours >= 6 && hours < 10) {
            body.style.background = "linear-gradient(135deg, #00b4db, #0083b0)"; 
        } else if (hours >= 17 && hours < 19) {
            body.style.background = "linear-gradient(135deg, #da22ff, #9733ee)"; 
        } else if (hours >= 19 || hours < 5) {
            body.style.background = "linear-gradient(135deg, #0f2027, #2c5364)"; 
        }
    };
    setInterval(updateTime, 1000); 
    updateTime();

    // --- 2. THÔNG BÁO TRẠNG THÁI (TOAST) ---
    function showStatus(msg) {
        const desc = document.getElementById("desc");
        const originalText = desc.innerText;
        desc.innerText = "🔔 " + msg;
        setTimeout(() => { 
            if (desc.innerText.includes("🔔")) desc.innerText = originalText; 
        }, 3000);
    }

    // --- 3. HIỆU ỨNG THỜI TIẾT RAINBOW ---
    function createEffect(type) {
        const container = document.getElementById("weather-effect");
        if (!container || container.dataset.type === type) return;
        
        container.dataset.type = type;
        container.innerHTML = "";
        const count = type === "rain" ? 100 : 50;
        
        for (let i = 0; i < count; i++) {
            const drop = document.createElement("div");
            drop.className = "drop";
            drop.style.left = Math.random() * 100 + "vw";
            drop.style.width = type === "rain" ? "2px" : "10px";
            drop.style.height = type === "rain" ? "20px" : "10px";
            if (type === "snow") drop.style.borderRadius = "50%";
            drop.style.animationDuration = (Math.random() * 2 + 1) + "s";
            drop.style.filter = `hue-rotate(${Math.random() * 360}deg)`; 
            container.appendChild(drop);
        }
    }

    // --- 4. LẤY DỮ LIỆU THỜI TIẾT & VỊ TRÍ SONG SONG ---
    async function fetchData(lat, lon) {
        try {
            const [wRes, aRes, gRes] = await Promise.all([
                fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`),
                fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`),
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
            ]);

            const wData = await wRes.json();
            const aData = await aRes.json();
            const gData = await gRes.json();

            // Cập nhật Nhiệt độ và Gió
            if (wData.current_weather) {
                document.getElementById("temp").innerHTML = `${Math.round(wData.current_weather.temperature)}<span class="deg-symbol">°C</span>`;
                document.getElementById("wind").innerText = wData.current_weather.windspeed;
                
                const code = wData.current_weather.weathercode;
                if (code >= 51) {
                    createEffect(code > 70 ? "snow" : "rain");
                } else {
                    const container = document.getElementById("weather-effect");
                    if (container) container.innerHTML = "";
                }
            }

            // --- FIX LỖI AQI TẠI ĐÂY ---
            const aqi = (aData && aData.current) ? aData.current.us_aqi : null;
            document.getElementById("aqi").innerText = aqi !== null ? aqi : "--";
            
            let quality = "N/A";
            if (aqi !== null) {
                if (aqi <= 50) quality = "Tốt";
                else if (aqi <= 100) quality = "Trung bình";
                else quality = "Kém";
            }
            document.getElementById("desc").innerText = "Không khí: " + quality;

            // Cập nhật Vị trí
            const addr = gData.address || {};
            const place = addr.suburb || addr.village || addr.city || addr.town || addr.county;
            document.getElementById("location").innerText = "Vị trí: " + (place || "Bản đồ");

        } catch (e) { 
            console.error("Lỗi Fetch:", e);
            document.getElementById("desc").innerText = "Lỗi kết nối dữ liệu";
        }
    }

    // --- 5. LOGIC ĐỊNH VỊ ---
    const getPosition = () => {
        navigator.geolocation.getCurrentPosition(
            pos => {
                const { latitude, longitude } = pos.coords;
                localStorage.setItem("lat", latitude);
                localStorage.setItem("lon", longitude);
                fetchData(latitude, longitude);
                showStatus("Đã cập nhật vị trí");
            },
            err => { 
                const oldLat = localStorage.getItem("lat");
                const oldLon = localStorage.getItem("lon");
                if (oldLat && oldLon) {
                    fetchData(oldLat, oldLon);
                    showStatus("Dùng vị trí cũ");
                } else {
                    fetchData(20.25, 105.97); // Mặc định Ninh Bình cho "hợp lý"
                    showStatus("Vị trí mặc định");
                }
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    };

    getPosition();
    const locBtn = document.getElementById("location");
    if (locBtn) {
        locBtn.style.cursor = "pointer";
        locBtn.onclick = getPosition;
    }

    // --- 6. HIỆU ỨNG KHỐI 3D ---
    const wall = document.getElementById("block-wall");
    if (wall) {
        wall.innerHTML = "";
        for (let i = 0; i < 35; i++) {
            const col = document.createElement("div");
            col.className = "column";
            col.innerHTML = '<div class="cube"></div><div class="cube hidden"></div>';
            wall.appendChild(col);
        }
        setInterval(() => {
            document.querySelectorAll(".column").forEach(col => {
                if (Math.random() > 0.8 && col.lastChild) {
                    col.lastChild.classList.toggle("hidden");
                }
            });
        }, 1500);
    }
}

window.onload = init;
