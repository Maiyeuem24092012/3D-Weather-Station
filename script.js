function init() {
    // 1. Đồng hồ
    const updateTime = () => {
        const now = new Date();
        document.getElementById("display").innerText = now.toLocaleTimeString('vi-VN', { hour12: false });
        document.getElementById("day-of-week").innerText = now.toLocaleDateString('vi-VN', { weekday: 'long' });
        document.getElementById("full-date").innerText = now.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
    };
    setInterval(updateTime, 1000); updateTime();

    // 2. Hiệu ứng thời tiết Rainbow
    function createEffect(type) {
        const container = document.getElementById("weather-effect");
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

    // 3. Lấy dữ liệu
    async function fetchData(lat, lon) {
        try {
            const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
            const wData = await wRes.json();
            const temp = Math.round(wData.current_weather.temperature);
            const code = wData.current_weather.weathercode;
            
            document.getElementById("temp").innerHTML = `${temp}<span class="deg-symbol">°C</span>`;
            document.getElementById("wind").innerText = wData.current_weather.windspeed;
            
            // Nếu weathercode > 50 là có mưa/tuyết
            if (code >= 51) createEffect(code > 70 ? "snow" : "rain");

            const gRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const gData = await gRes.json();
            document.getElementById("location").innerText = "Vị trí: " + (gData.address.city || gData.address.town || "Ninh Bình");
        } catch (e) { console.log("Lỗi tải dữ liệu"); }
    }

    const sLat = localStorage.getItem("lat"), sLon = localStorage.getItem("lon");
    if (sLat) fetchData(sLat, sLon);
    else navigator.geolocation.getCurrentPosition(pos => {
        localStorage.setItem("lat", pos.coords.latitude);
        localStorage.setItem("lon", pos.coords.longitude);
        fetchData(pos.coords.latitude, pos.coords.longitude);
    });

    // 4. Khối 3D nảy
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
