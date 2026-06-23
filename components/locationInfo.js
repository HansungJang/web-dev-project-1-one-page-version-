class LocationInfo extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
<div>
        <ul class="loc-list">
          <li class="loc-item sr">
            <div class="loc-ico">🔍</div>
            <div class="loc-meta">
              <span class="loc-lbl" id="location-card-name-title" contenteditable="false">사업체명</span>
              <span class="loc-val" id="location-card-name-body" contenteditable="false">마음,인지행동심리상담센터</span>
            </div>
          </li>
          <li class="loc-item sr">
            <div class="loc-ico">📍</div>
            <div class="loc-meta">
              <span class="loc-lbl" id="location-card-address-title" contenteditable="false">주소</span>
              <span class="loc-val" id="location-card-address-body" contenteditable="false">경기도 수원시 팔달구 경수대로466번길 58(인계동) [아이오피스 내부에 있습니다]</span>
            </div>
          </li>
          <li class="loc-item sr d3">
            <div class="loc-ico">📞</div>
            <div class="loc-meta">
              <span class="loc-lbl" id="location-card-phone-title" contenteditable="false">전화번호</span>
              <span class="loc-val" id="location-card-phone-body" contenteditable="false">010-7577-6940</span>
            </div>
          </li>
          <li class="loc-item sr d4">
            <div class="loc-ico">✉️</div>
            <div class="loc-meta">
              <span class="loc-lbl" id="location-card-email-title" contenteditable="false">이메일</span>
              <span class="loc-val" id="location-card-email-body" contenteditable="false">jihye0708@hotmail.com</span>
            </div>
          </li>
          <li class="loc-item sr d5">
            <div class="loc-ico">🚃</div>
            <div class="loc-meta">
              <span class="loc-lbl" id="location-card-subway-title" contenteditable="false">지하철 이용시</span>
              <span class="loc-val" id="location-card-subway-body1" contenteditable="false">수인분당선 (수원시청역 6번 출구)</span>
              <span class="loc-val" id="location-card-subway-body2" contenteditable="false">홈플러스와 수원시청 사잇 길로 쭉 내려오시면, 도보 5-7분 거리에 있습니다.</span>              
            </div>
          </li>
          <li class="loc-item sr d6">
            <div class="loc-ico">🚌</div>
            <div class="loc-meta">
              <span class="loc-lbl" id="location-card-bus-title" contenteditable="false">버스 이용시</span>
              <span class="loc-val" id="location-card-bus-body" contenteditable="false">KBS 수원센터에서 하차 하시면, 도보 2분 거리에 있습니다.</span>
            </div>
          </li>
        </ul>
      </div>
        `;
    }
}

customElements.define('location-info', LocationInfo); 
 

 
 