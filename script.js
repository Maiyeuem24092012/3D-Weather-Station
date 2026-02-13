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

    // 2. Dữ liệu Thời tiết & Vị trí
    async function fetchData(lat, lon) {
        try {
            const gRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const gData = await gRes.json();
            document.getElementById("location").innerText = "Vị trí: " + (gData.address.city || gData.address.town || "Ninh Bình");

            const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
            const wData = await wRes.json();
            const tempVal = Math.round(wData.current_weather.temperature);
            document.getElementById("temp").innerHTML = `${tempVal}<span class="deg-symbol">°C</span>`;
            document.getElementById("wind").innerText = wData.current_weather.windspeed;

            const aRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`);
            const aData = await aRes.json();
            const aqi = aData.current.us_aqi;
            document.getElementById("aqi").innerText = aqi;
            document.getElementById("desc").innerText = aqi < 50 ? "Không khí: Tốt" : "Không khí: Trung bình";
        } catch (e) { document.getElementById("location").innerText = "Lỗi kết nối API"; }
    }

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

    // 3. Khối 3D nảy 2 tầng ngẫu nhiên
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
