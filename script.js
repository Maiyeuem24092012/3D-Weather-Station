/**
 * Hàm khởi tạo Dashboard: Tích hợp định vị thông minh, 
 * thời tiết Rainbow và hiệu ứng Dynamic Background.
 */
function init() {
    // --- 1. ĐỒNG HỒ & ĐỔI MÀU NỀN THEO GIỜ ---
    const updateTime = () => {
        const now = new Date();
        const hours = now.getHours();
        
        // Hiển thị giờ 24h
        document.getElementById("display").innerText = now.toLocaleTimeString('vi-VN', { hour12: false });
        // Hiển thị Thứ
        document.getElementById("day-of-week").innerText = now.toLocaleDateString('vi-VN', { weekday: 'long' });
        
        // Định dạng Ngày ... tháng ... năm ...
        const day = now.getDate();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        document.getElementById("full-date").innerText = `Ngày ${day} tháng ${month} năm ${year}`;

        // Dynamic Background: Đổi màu nền dựa trên giờ thực tế
        const body = document.body;
        if (hours >= 6 && hours < 10) {
            body.style.background = "linear-gradient(135deg, #00b4db, #0083b0)"; // Sáng sớm
        } else if (hours >= 17 && hours < 19) {
            body.style.background = "linear-gradient(135deg, #da22ff, #9733ee)"; // Hoàng hôn
        } else if (hours >= 19 || hours < 5) {
            body.style.background = "linear-gradient(135deg, #0f2027, #2c5364)"; // Ban đêm
        }
    };
    setInterval(updateTime, 1000); 
    updateTime();

    // --- 2. THÔNG BÁO TRẠNG THÁI (TOAST) ---
    function showStatus(msg) {
        const desc = document.getElementById("desc");
        const originalText = desc.innerText;
        desc.innerText = "🔔 " + msg; // Thêm icon chuông cho chuyên nghiệp
        setTimeout(() => { 
            desc.innerText = originalText; 
        }, 3000);
    }

    // --- 3. HIỆU ỨNG THỜI TIẾT RAINBOW ---
    function createEffect(type) {
        const container = document.getElementById("weather-effect");
        if (!container || container.dataset.type === type) return;
        
        container.dataset.type = type; // Tránh tạo lại hiệu ứng trùng lặp
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
            // Hiệu ứng xoay màu cầu vồng
            drop.style.filter = `hue-rotate(${Math.random() * 360}deg)`; 
            container.appendChild(drop);
        }
    }

    // --- 4. LẤY DỮ LIỆU THỜI TIẾT & VỊ TRÍ SONG SONG ---
    async function fetchData(lat, lon) {
        try {
            // Tải song song 3 API để tối ưu tốc độ load
            const [wRes, aRes, gRes] = await Promise.all([
                fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`),
                fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`),
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
            ]);

            const wData = await wRes.json();
            const aData = await aRes.json();
            const gData = await gRes.json();

            // Cập nhật Nhiệt độ và Gió
            document.getElementById("temp").innerHTML = `${Math.round(wData.current_weather.temperature)}<span class="deg-symbol">°C</span>`;
            document.getElementById("wind").innerText = wData.current_weather.windspeed;

            // Kích hoạt hiệu ứng dựa trên Weather Code
            const code = wData.current_weather.weathercode;
            if (code >= 51) {
                createEffect(code > 70 ? "snow" : "rain");
            } else {
                const container = document.getElementById("weather-effect");
                if (container) container.innerHTML = "";
            }

            // Cập nhật AQI và mô tả chất lượng không khí
            const aqi = aData.current.us_aqi;
            document.getElementById("aqi").innerText = aqi || "50";
            let quality = aqi > 100 ? "Kém" : (aqi > 50 ? "Trung bình" : "Tốt");
            document.getElementById("desc").innerText = "Không khí: " + quality;

            // Cập nhật Vị trí chi tiết
            const place = gData.address.suburb || gData.address.village || gData.address.city || gData.address.town;
            document.getElementById("location").innerText = "Vị trí: " + (place || "Trạm ISS (???)");

        } catch (e) { 
            document.getElementById("desc").innerText = "Lỗi kết nối dữ liệu";
        }
    }

    // --- 5. LOGIC ĐỊNH VỊ 3 TẦNG: Mới nhất -> Cũ -> ISS ---
    const getPosition = () => {
        navigator.geolocation.getCurrentPosition(
            pos => {
                // Tầng 1: Vị trí thực tế mới nhất
                localStorage.setItem("lat", pos.coords.latitude);
                localStorage.setItem("lon", pos.coords.longitude);
                fetchData(pos.coords.latitude, pos.coords.longitude);
                showStatus("Đã cập nhật vị trí mới");
            },
            err => { 
                // Tầng 2: Vị trí lưu trong bộ nhớ
                const oldLat = localStorage.getItem("lat");
                const oldLon = localStorage.getItem("lon");
                if (oldLat && oldLon) {
                    fetchData(oldLat, oldLon);
                    showStatus("Dùng vị trí từ bộ nhớ");
                } else {
                    // Tầng 3: Trạm ISS (Mặc định khi không có gì)
                    fetchData(-48.8767, -123.3933); 
                    showStatus("Chào mừng đến với ISS!");
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    // Khởi chạy định vị
    getPosition();

    // Gán sự kiện Click làm mới cho dòng Vị trí
    const locBtn = document.getElementById("location");
    if (locBtn) {
        locBtn.style.cursor = "pointer";
        locBtn.onclick = getPosition;
    }

    // --- 6. HIỆU ỨNG KHỐI 3D NẢY NGẪU NHIÊN ---
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
                // Tỉ lệ nảy 20% giúp giao diện mượt mà, đỡ rối mắt
                if (Math.random() > 0.8 && col.lastChild) {
                    col.lastChild.classList.toggle("hidden");
                }
            });
        }, 1500);
    }
}

// Chạy hàm init khi toàn bộ trang đã tải xong
window.onload = init;
