function init() {
    // 1. Cập nhật Đồng hồ & Ngày tháng (Đã sửa lỗi hiển thị tháng)
    const updateTime = () => {
        const now = new Date();
        // Hiển thị giờ 24h
        document.getElementById("display").innerText = now.toLocaleTimeString('vi-VN', { hour12: false });
        // Hiển thị Thứ
        document.getElementById("day-of-week").innerText = now.toLocaleDateString('vi-VN', { weekday: 'long' });
        
        // Cập nhật Ngày ... tháng ... năm ...
        const day = now.getDate();
        const month = now.getMonth() + 1; // getMonth trả về 0-11 nên phải +1
        const year = now.getFullYear();
        document.getElementById("full-date").innerText = `Ngày ${day} tháng ${month} năm ${year}`;
    };
    setInterval(updateTime, 1000); 
    updateTime();

    // 2. Tạo Hiệu ứng Thời tiết Rainbow (Mưa/Tuyết)
    function createEffect(type) {
        const container = document.getElementById("weather-effect");
        if (!container) return;
        
        // Kiểm tra nếu hiệu ứng hiện tại giống loại mới thì không tạo lại để tránh giật lag
        if (container.dataset.type === type) return;
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

    // 3. Lấy dữ liệu Thời tiết, Vị trí và AQI song song (Tối ưu tốc độ)
    async function fetchData(lat, lon) {
        try {
            // Sử dụng Promise.all để gọi đồng thời 3 API giúp load cực nhanh
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

            // Kích hoạt hiệu ứng thời tiết dựa trên mã code
            if (code >= 51) {
                createEffect(code > 70 ? "snow" : "rain");
            } else {
                const container = document.getElementById("weather-effect");
                if (container) container.innerHTML = ""; // Xóa hiệu ứng nếu trời đẹp
            }

            // Cập nhật AQI và mô tả chất lượng không khí
            const aqi = aData.current.us_aqi;
            document.getElementById("aqi").innerText = aqi || "50";
            let quality = "Tốt";
            if (aqi > 50) quality = "Trung bình";
            if (aqi > 100) quality = "Kém";
            document.getElementById("desc").innerText = "Không khí: " + quality;

            // Cập nhật Vị trí chi tiết (Ưu tiên lấy tên khu vực nhỏ, nếu ở ISS thì hiện ISS)
            const placeName = gData.address.suburb || gData.address.village || gData.address.city || gData.address.town;
            document.getElementById("location").innerText = "Vị trí: " + (placeName || "Trạm ISS (???)");

        } catch (e) { 
            console.log("Lỗi tải dữ liệu:", e);
            document.getElementById("desc").innerText = "Lỗi kết nối dữ liệu";
        }
    }

    // 4. Định vị thông minh 3 tầng: Mới nhất -> Cũ -> ISS
    navigator.geolocation.getCurrentPosition(
        pos => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            
            // Lưu lại vị trí thành công vào bộ nhớ
            localStorage.setItem("lat", lat);
            localStorage.setItem("lon", lon);
            
            fetchData(lat, lon);
        },
        err => { 
            // Nếu lỗi, thử tìm vị trí cũ trong máy
            const oldLat = localStorage.getItem("lat");
            const oldLon = localStorage.getItem("lon");
            
            if (oldLat && oldLon) {
                fetchData(oldLat, oldLon);
            } else {
                // Cuối cùng là dùng ISS mặc định
                fetchData(-48.8767, -123.3933); 
            }
        },
        { 
            enableHighAccuracy: true, 
            timeout: 10000, 
            maximumAge: 0 
        }
    );
    
    // 5. Hiệu ứng khối 3D nảy ngẫu nhiên sát đáy
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
                if (Math.random() > 0.8) { // Giảm tỉ lệ nảy để nhìn đỡ rối mắt
                    if (col.lastChild) col.lastChild.classList.toggle("hidden");
                }
            });
        }, 1500);
    }
}

window.onload = init;
