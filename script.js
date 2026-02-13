function init() {
    // 1. Cập nhật Thời gian & Ngày tháng
    const updateTime = () => {
        const now = new Date();
        document.getElementById("display").innerText = now.toLocaleTimeString('vi-VN', { hour12: false });
        document.getElementById("day-of-week").innerText = now.toLocaleDateString('vi-VN', { weekday: 'long' });
        document.getElementById("full-date").innerText = now.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
    };
    setInterval(updateTime, 1000);
    updateTime();

    // 2. Lấy Dữ liệu Thời tiết & Vị trí
    async function fetchData(lat, lon) {
        try {
            // Lấy tên địa danh (Vd: Ninh Bình)
            const gRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const gData = await gRes.json();
            document.getElementById("location").innerText = gData.address.city || gData.address.town || gData.address.province || "Vị trí của bạn";

            // Lấy Thời tiết & Gió
            const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
            const wData = await wRes.json();
            document.getElementById("temp").innerText = Math.round(wData.current_weather.temperature) + "°C";
            document.getElementById("wind").innerText = wData.current_weather.windspeed;

            // Lấy Chất lượng không khí
            const aRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`);
            const aData = await aRes.json();
            const aqiValue = aData.current.us_aqi;
            document.getElementById("aqi").innerText = aqiValue;
            document.getElementById("desc").innerText = aqiValue < 50 ? "Không khí: Tốt" : "Không khí: Trung bình";

        } catch (e) { document.getElementById("location").innerText = "Lỗi kết nối API"; }
    }

    // Tự động nhớ vị trí sau lần đầu cho phép
    const sLat = localStorage.getItem("lat"), sLon = localStorage.getItem("lon");
    if (sLat && sLon) {
        fetchData(sLat, sLon);
    } else {
        navigator.geolocation.getCurrentPosition(pos => {
            localStorage.setItem("lat", pos.coords.latitude);
            localStorage.setItem("lon", pos.coords.longitude);
            fetchData(pos.coords.latitude, pos.coords.longitude);
        });
    }

    // 3. Khối 3D nảy (Hiện/Ẩn tầng 2 ngẫu nhiên)
    const wall = document.getElementById("block-wall");
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

window.onload = init;