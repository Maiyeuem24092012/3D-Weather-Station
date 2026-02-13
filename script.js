function init() {
    // 1. Cập nhật Đồng hồ hệ thống
    const updateTime = () => {
        const now = new Date();
        document.getElementById("display").innerText = now.toLocaleTimeString('vi-VN', { hour12: false });
        document.getElementById("day-of-week").innerText = now.toLocaleDateString('vi-VN', { weekday: 'long' });
        document.getElementById("full-date").innerText = now.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
    };
    setInterval(updateTime, 1000); 
    updateTime();

    // 2. Tạo Hiệu ứng Thời tiết Rainbow (Mưa/Tuyết)
    function createEffect(type) {
        const container = document.getElementById("weather-effect");
        if (!container) return;
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
            drop.style.filter = `hue-rotate(${Math.random() * 360}deg)`; // Tạo màu cầu vồng
            container.appendChild(drop);
        }
    }

    // 3. Lấy dữ liệu Thời tiết, Vị trí và AQI song song (Tăng tốc độ load)
    async function fetchData(lat, lon) {
        try {
            // Sử dụng Promise.all để gọi đồng thời 3 API, tránh treo phần AQI
            const [wRes, aRes, gRes] = await Promise.all([
                fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`),
                fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`),
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
            ]);

            const wData = await wRes.json();
            const aData = await aRes.json();
            const gData = await gRes.json();

            // Cập nhật Nhiệt độ và Gió
            const temp = Math.round(wData.current_weather.temperature);
            const code = wData.current_weather.weathercode;
            // Dùng innerHTML để hỗ trợ hiển thị ký hiệu độ °C từ CSS
            document.getElementById("temp").innerHTML = `${temp}<span class="deg-symbol">°C</span>`;
            document.getElementById("wind").innerText = wData.current_weather.windspeed;

            // Kích hoạt hiệu ứng nếu có mưa/tuyết (weathercode >= 51)
            if (code >= 51) createEffect(code > 70 ? "snow" : "rain");

            // Cập nhật AQI và Trạng thái không khí
            const aqi = aData.current.us_aqi;
            document.getElementById("aqi").innerText = aqi || "50";
            let quality = "Tốt";
            if (aqi > 50) quality = "Trung bình";
            if (aqi > 100) quality = "Kém";
            document.getElementById("desc").innerText = "Không khí: " + quality;

            // Cập nhật Vị trí chi tiết
            document.getElementById("location").innerText = "Vị trí: " + (gData.address.suburb || gData.address.village || gData.address.city || gData.address.town || "Ninh Bình");

        } catch (e) { 
            console.log("Lỗi tải dữ liệu:", e);
            document.getElementById("desc").innerText = "Lỗi kết nối dữ liệu";
        }
    }

    // 4. Xử lý Định vị và Bộ nhớ đệm (LocalStorage)
    const sLat = localStorage.getItem("lat"), sLon = localStorage.getItem("lon");
    if (sLat && sLon) {
        fetchData(sLat, sLon);
    } else {
        navigator.geolocation.getCurrentPosition(
            pos => {
                localStorage.setItem("lat", pos.coords.latitude);
                localStorage.setItem("lon", pos.coords.longitude);
                fetchData(pos.coords.latitude, pos.coords.longitude);
            },
            err => {
                // Mặc định về Ninh Bình nếu không lấy được vị trí
                fetchData(20.25, 105.97);
            }
        );
    }

    // 5. Hiệu ứng khối 3D nảy sát đáy (Tầng 2 hiện/ẩn ngẫu nhiên)
    const wall = document.getElementById("block-wall");
    if (wall) {
        wall.innerHTML = ""; // Xóa các khối cũ nếu có
        for (let i = 0; i < 35; i++) {
            const col = document.createElement("div");
            col.className = "column";
            col.innerHTML = '<div class="cube"></div><div class="cube hidden"></div>';
            wall.appendChild(col);
        }
        setInterval(() => {
            document.querySelectorAll(".column").forEach(col => {
                if (Math.random() > 0.7) col.lastChild.classList.toggle("hidden");
            });
        }, 1000);
    }
}

window.onload = init;
