function init() {
    // 1. Cập nhật Đồng hồ & Ngày tháng (Đã thêm đầy đủ chữ Ngày/tháng/năm)
    const updateTime = () => {
        const now = new Date();
        // Hiển thị giờ 24h
        document.getElementById("display").innerText = now.toLocaleTimeString('vi-VN', { hour12: false });
        // Hiển thị Thứ
        document.getElementById("day-of-week").innerText = now.toLocaleDateString('vi-VN', { weekday: 'long' });
        
        // Tùy chỉnh hiển thị: Ngày ... tháng ... năm ...
        const day = now.getDate();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        document.getElementById("full-date").innerText = `Ngày ${day} tháng ${month} năm ${year}`;
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
            drop.style.filter = `hue-rotate(${Math.random() * 360}deg)`; 
            container.appendChild(drop);
        }
    }

    // 3. Lấy dữ liệu Thời tiết, Vị trí và AQI song song
    async function fetchData(lat, lon) {
        try {
            // Gọi đồng thời 3 API để tránh treo dữ liệu
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
            document.getElementById("temp").innerHTML = `${temp}<span class="deg-symbol">°C</span>`;
            document.getElementById("wind").innerText = wData.current_weather.windspeed;

            // Kích hoạt hiệu ứng thời tiết
            if (code >= 51) createEffect(code > 70 ? "snow" : "rain");

            // Cập nhật AQI
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

    // 4. Định vị
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
            err => { fetchData(20.25, 105.97); } // Mặc định Ninh Bình
        );
    }

    // 5. Hiệu ứng khối 3D sát đáy
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
                if (Math.random() > 0.7) col.lastChild.classList.toggle("hidden");
            });
        }, 1000);
    }
}

window.onload = init;
