async function includeHTML() {
    const elements = document.querySelectorAll('[basic-components]');
    
    for (const el of elements) {
        const file = el.getAttribute('basic-components');
        try {
            const response = await fetch(file);
            if (response.ok) {
                el.innerHTML = await response.text();
                el.removeAttribute('basic-components'); // 처리 후 속성 제거
            } else {
                el.innerHTML = "Page not found.";
            }
        } catch (err) {
            console.error("Error loading component:", err);
        }
    }
}

// 페이지 로드 시 실행
window.addEventListener('DOMContentLoaded', includeHTML);