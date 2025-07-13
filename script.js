document.addEventListener('DOMContentLoaded', () => {
    const evaluationForm = document.getElementById('evaluationForm');
    const customerIdInput = document.getElementById('customerId');
    const ratingInput = document.getElementById('rating'); // เพิ่มตัวแปรสำหรับ input คะแนน
    const decreaseRatingBtn = document.getElementById('decreaseRating'); // เพิ่มตัวแปรสำหรับปุ่มลด
    const increaseRatingBtn = document.getElementById('increaseRating'); // เพิ่มตัวแปรสำหรับปุ่มเพิ่ม
    const feedbackTextarea = document.getElementById('feedback');
    const insightsSummaryDiv = document.getElementById('insightsSummary');
    const clearDataBtn = document.getElementById('clearDataBtn');

    let evaluations = [];

    // โหลดข้อมูลการประเมินจาก Local Storage เมื่อหน้าเว็บโหลด
    function loadEvaluations() {
        const storedEvaluations = localStorage.getItem('customerEvaluations');
        if (storedEvaluations) {
            evaluations = JSON.parse(storedEvaluations);
        }
        renderInsights();
    }

    // บันทึกข้อมูลการประเมินลง Local Storage
    function saveEvaluations() {
        localStorage.setItem('customerEvaluations', JSON.stringify(evaluations));
    }

    // แสดงผลข้อมูลเชิงลึก
    function renderInsights() {
        insightsSummaryDiv.innerHTML = ''; // เคลียร์ข้อมูลเก่า

        if (evaluations.length === 0) {
            insightsSummaryDiv.innerHTML = '<p>ยังไม่มีข้อมูลการประเมิน</p>';
            return;
        }

        // คำนวณคะแนนเฉลี่ย
        const totalRating = evaluations.reduce((sum, evalItem) => sum + parseInt(evalItem.rating), 0);
        const averageRating = (totalRating / evaluations.length).toFixed(2);

        // นับจำนวนการประเมินตามคะแนน
        const ratingCounts = {};
        evaluations.forEach(evalItem => {
            ratingCounts[evalItem.rating] = (ratingCounts[evalItem.rating] || 0) + 1;
        });

        // ลูกค้าที่มีปัญหาบ่อย (คะแนนต่ำ) หรือได้รับคำชมบ่อย (คะแนนสูง)
        const customerFeedbackMap = {};
        evaluations.forEach(evalItem => {
            if (!customerFeedbackMap[evalItem.customerId]) {
                customerFeedbackMap[evalItem.customerId] = {
                    totalRating: 0,
                    count: 0,
                    feedbacks: []
                };
            }
            customerFeedbackMap[evalItem.customerId].totalRating += parseInt(evalItem.rating);
            customerFeedbackMap[evalItem.customerId].count++;
            if (evalItem.feedback) {
                customerFeedbackMap[evalItem.customerId].feedbacks.push(evalItem.feedback);
            }
        });

        const sortedCustomers = Object.keys(customerFeedbackMap).map(id => ({
            id: id,
            averageRating: (customerFeedbackMap[id].totalRating / customerFeedbackMap[id].count).toFixed(2),
            count: customerFeedbackMap[id].count,
            feedbacks: customerFeedbackMap[id].feedbacks
        })).sort((a, b) => a.averageRating - b.averageRating); // เรียงจากคะแนนน้อยไปมาก

        const topProblemCustomers = sortedCustomers.slice(0, Math.min(3, sortedCustomers.length)).filter(cust => cust.averageRating < 3.5);
        const topGoodCustomers = sortedCustomers.slice(Math.max(0, sortedCustomers.length - 3), sortedCustomers.length).filter(cust => cust.averageRating > 3.5).reverse();


        // แสดงผล
        let insightsHTML = `
            <div>
                <strong>จำนวนการประเมินทั้งหมด:</strong> ${evaluations.length} ครั้ง
            </div>
            <div>
                <strong>คะแนนความพึงพอใจเฉลี่ย:</strong> ${averageRating} ดาว
            </div>
            <div>
                <strong>การกระจายคะแนน:</strong>
                <ul>
                    ${Object.keys(ratingCounts).sort((a, b) => b - a).map(rating => `
                        <li>${rating} ดาว: ${ratingCounts[rating]} ครั้ง</li>
                    `).join('')}
                </ul>
            </div>
        `;

        if (topProblemCustomers.length > 0) {
            insightsHTML += `
                <div>
                    <strong>ลูกค้าที่อาจมีปัญหาบ่อย (คะแนนต่ำ):</strong>
                    <ul>
                        ${topProblemCustomers.map(cust => `
                            <li><strong>${cust.id}</strong> (คะแนนเฉลี่ย: ${cust.averageRating} ดาว, ${cust.count} ครั้ง):
                                ${cust.feedbacks.length > 0 ? cust.feedbacks.join('; ') : 'ไม่มีข้อเสนอแนะ'}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        if (topGoodCustomers.length > 0) {
            insightsHTML += `
                <div>
                    <strong>ลูกค้าที่ได้รับคำชม/ประเมินดี (คะแนนสูง):</strong>
                    <ul>
                        ${topGoodCustomers.map(cust => `
                            <li><strong>${cust.id}</strong> (คะแนนเฉลี่ย: ${cust.averageRating} ดาว, ${cust.count} ครั้ง):
                                ${cust.feedbacks.length > 0 ? cust.feedbacks.join('; ') : 'ไม่มีข้อเสนอแนะ'}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        insightsSummaryDiv.innerHTML = insightsHTML;
    }

    // --- Logic สำหรับปุ่มเพิ่ม/ลดคะแนน ---
    decreaseRatingBtn.addEventListener('click', () => {
        let currentRating = parseInt(ratingInput.value);
        if (currentRating > parseInt(ratingInput.min)) {
            ratingInput.value = currentRating - 1;
        }
    });

    increaseRatingBtn.addEventListener('click', () => {
        let currentRating = parseInt(ratingInput.value);
        if (currentRating < parseInt(ratingInput.max)) {
            ratingInput.value = currentRating + 1;
        }
    });
    // --- สิ้นสุด Logic สำหรับปุ่มเพิ่ม/ลดคะแนน ---


    // Handle form submission
    evaluationForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const customerId = customerIdInput.value.trim();
        const rating = ratingInput.value; // อ่านค่าจาก input type="number"
        const feedback = feedbackTextarea.value.trim();

        if (!customerId || !rating) {
            alert('กรุณากรอกรหัสลูกค้า/ชื่อเล่น และให้คะแนนความพึงพอใจด้วยครับ!');
            return;
        }

        const newEvaluation = {
            timestamp: new Date().toISOString(),
            customerId: customerId,
            rating: rating, // ใช้ค่าจาก input type="number"
            feedback: feedback
        };

        evaluations.push(newEvaluation);
        saveEvaluations();
        renderInsights();

        // รีเซ็ตฟอร์ม (ตั้งค่าคะแนนเริ่มต้นกลับไปที่ 3)
        evaluationForm.reset();
        ratingInput.value = 3; // ตั้งค่าเริ่มต้น
        customerIdInput.focus();
        alert('บันทึกการประเมินเรียบร้อยแล้วครับ! 👍');
    });

    // ปุ่มล้างข้อมูลทั้งหมด
    clearDataBtn.addEventListener('click', () => {
        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลการประเมินทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้!')) {
            evaluations = [];
            saveEvaluations();
            renderInsights();
            alert('ล้างข้อมูลเรียบร้อยแล้วครับ!');
        }
    });

    // โหลดข้อมูลเมื่อเริ่มต้น
    loadEvaluations();
});
