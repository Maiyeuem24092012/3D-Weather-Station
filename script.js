/**
 * Rainbow 3D Dashboard - Thành Đạt Profile
 * Bản gộp tối ưu hoàn chỉnh:
 * - Fix AQI null
 * - Fix vị trí không nhảy
 * - Fallback lat/lon an toàn
 * - Reverse geocoding ổn định
 * - Dynamic effect giữ nguyên
 */

function init() {

    /* ================================
       1. ĐỒNG HỒ & NỀN ĐỘNG
    ==================================*/
    const updateTime = () => {
        const now = new Date();
        const hours = now.getHours();

        document.getElementById("display").innerText =
            now.toLocaleTimeString('vi-VN', { hour12: false });

        document.getElementById("day-of-week").innerText =
            now.toLocaleDateString('vi-VN', { weekday: 'long' });

        document.getElementById("full-date").innerText =
            `Ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;

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


    /* ================================
       2. TOAST THÔNG BÁO
    ==================================*/
    function showStatus(msg) {
        const desc = document.getElementById("desc");
        const original = desc.innerText;
        desc.innerText = "🔔 " + msg;
        setTimeout(() => {
            if (desc.innerText.includes("🔔")) {
                desc.innerText = original;
            }
        }, 3000);
    }


    /* ================================
       3. HIỆU ỨNG THỜI TIẾT
    ==================================*/
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


    /* ================================
       4. FETCH DATA SONG SONG
    ==================================*/
    async function fetchData(lat, lon) {
        try {

            const [wRes, aRes, gRes] = await Promise.all([
                fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`),
                fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`),
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`)
            ]);

            const wData = await wRes.json();
            const aData = await aRes.json();
            let gData = {};

            try {
                gData = await gRes.json();
            } catch {
                gData = {};
            }

            /* ===== NHIỆT ĐỘ ===== */
            if (wData.current_weather) {
                const cw = wData.current_weather;

                document.getElementById("temp").innerHTML =
                    `${Math.round(cw.temperature)}<span class="deg-symbol">°C</span>`;

                document.getElementById("wind").innerText = cw.windspeed;

                if (cw.weathercode >= 51) {
                    createEffect(cw.weathercode > 70 ? "snow" : "rain");
                } else {
                    const container = document.getElementById("weather-effect");
                    if (container) container.innerHTML = "";
                }
            }

            /* ===== AQI AN TOÀN ===== */
            const aqi = (aData && aData.current && aData.current.us_aqi != null)
                ? aData.current.us_aqi
                : null;

            document.getElementById("aqi").innerText =
                aqi !== null ? aqi : "--";

            let quality = "N/A";
            if (aqi !== null) {
                if (aqi <= 50) quality = "Tốt";
                else if (aqi <= 100) quality = "Trung bình";
                else if (aqi <= 150) quality = "Kém";
                else quality = "Rất kém";
            }

            document.getElementById("desc").innerText =
                "Không khí: " + quality;


            /* ===== VỊ TRÍ ỔN ĐỊNH ===== */
            const addr = gData.address || {};

            const place =
                addr.suburb ||
                addr.quarter ||
                addr.neighbourhood ||
                addr.village ||
                addr.town ||
                addr.city ||
                addr.county ||
                null;

            if (place) {
                document.getElementById("location").innerText =
                    "Vị trí: " + place;
            } else {
                document.getElementById("location").innerText =
                    `Vị trí: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`;
            }

        } catch (e) {
            console.error("Lỗi cập nhật dữ liệu:", e);
            document.getElementById("desc").innerText = "Lỗi kết nối dữ liệu";
        }
    }


    /* ================================
       5. ĐỊNH VỊ THÔNG MINH
    ==================================*/
    const getPosition = () => {

        const options = {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 10000
        };

        navigator.geolocation.getCurrentPosition(

            pos => {
                const { latitude, longitude } = pos.coords;

                localStorage.setItem("lat", latitude);
                localStorage.setItem("lon", longitude);

                fetchData(latitude, longitude);
                showStatus("Đã cập nhật vị trí thực tế");
            },

            () => {
                const oldLat = localStorage.getItem("lat");
                const oldLon = localStorage.getItem("lon");

                if (oldLat && oldLon) {
                    fetchData(oldLat, oldLon);
                    showStatus("Dùng vị trí từ bộ nhớ");
                } else {
                    fetchData(20.25, 105.97);
                    showStatus("Vị trí mặc định (Ninh Bình)");
                }
            },

            options
        );
    };

    getPosition();


    /* ================================
       6. KHỐI 3D RAINBOW
    ==================================*/
    const wall = document.getElementById("block-wall");

    if (wall) {
        wall.innerHTML = "";

        for (let i = 0; i < 35; i++) {
            const col = document.createElement("div");
            col.className = "column";
            col.innerHTML =
                '<div class="cube"></div><div class="cube hidden"></div>';
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
