// Hàm tính khoảng cách cosine giữa 2 vector
function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
    const normA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
    const normB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
    return dotProduct / (normA * normB);
}

// Hàm chuyển đổi text thành vector đặc trưng
function textToFeatureVector(text, vocabulary) {
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '') // Loại bỏ dấu câu
        .split(/\s+/); // Tách thành mảng các từ

    const vector = new Array(vocabulary.length).fill(0);
    words.forEach(word => {
        const index = vocabulary.indexOf(word);
        if (index !== -1) {
            vector[index]++;
        }
    });
    return vector;
}

// Hàm xây dựng từ điển từ tất cả các job
function buildVocabulary(jobs) {
    const vocabulary = new Set();
    jobs.forEach(job => {
        // Kết hợp title, description và requirements
        const text = `${job.title} ${job.description} ${job.requirements}`.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/);
        text.forEach(word => vocabulary.add(word));
    });
    return Array.from(vocabulary);
}

// Hàm tính điểm matching giữa CV và job
function calculateMatchingScore(cv, job, vocabulary) {
    // Tạo vector đặc trưng cho CV
    const cvText = `
        ${cv.personalInfo.jobTitle} 
        ${cv.personalInfo.summary}
        ${cv.experience.map(exp => `${exp.position} ${exp.description}`).join(' ')}
        ${cv.education.map(edu => `${edu.major} ${edu.description}`).join(' ')}
        ${cv.skills.map(skill => `${skill.name} ${skill.description}`).join(' ')}
    `;
    const cvVector = textToFeatureVector(cvText, vocabulary);

    // Tạo vector đặc trưng cho job
    const jobText = `${job.title} ${job.description} ${job.requirements}`;
    const jobVector = textToFeatureVector(jobText, vocabulary);

    // Tính điểm tương đồng
    const textSimilarity = cosineSimilarity(cvVector, jobVector);

    // Tính điểm phù hợp về lương
    const cvSalaryRange = cv.personalInfo.expectedSalary || 0;
    const jobSalaryAvg = (Number(job.salaryMin) + Number(job.salaryMax)) / 2;
    const salarySimilarity = cvSalaryRange === 0 ? 1 : 
        1 - Math.min(Math.abs(cvSalaryRange - jobSalaryAvg) / jobSalaryAvg, 1);

    // Tính điểm phù hợp về địa điểm
    const locationSimilarity = cv.personalInfo.address && 
        job.contactAddress.toLowerCase().includes(cv.personalInfo.address.toLowerCase()) ? 1 : 0.5;

    // Tính điểm tổng hợp (có thể điều chỉnh trọng số)
    const weightText = 0.6;
    const weightSalary = 0.2;
    const weightLocation = 0.2;

    const totalScore = (
        textSimilarity * weightText + 
        salarySimilarity * weightSalary + 
        locationSimilarity * weightLocation
    );

    // Tìm các điểm matching cụ thể
    const matchingPoints = [];
    
    // Kiểm tra matching về kỹ năng
    cv.skills.forEach(skill => {
        if (jobText.toLowerCase().includes(skill.name.toLowerCase())) {
            matchingPoints.push(`Kỹ năng "${skill.name}" phù hợp với yêu cầu công việc`);
        }
    });

    // Kiểm tra matching về kinh nghiệm
    cv.experience.forEach(exp => {
        if (jobText.toLowerCase().includes(exp.position.toLowerCase())) {
            matchingPoints.push(`Có kinh nghiệm làm việc ở vị trí tương tự: ${exp.position}`);
        }
    });

    // Kiểm tra matching về học vấn
    cv.education.forEach(edu => {
        if (jobText.toLowerCase().includes(edu.major.toLowerCase())) {
            matchingPoints.push(`Chuyên ngành học ${edu.major} phù hợp với yêu cầu`);
        }
    });

    return {
        score: totalScore * 100, // Chuyển về thang điểm 100
        matchingPoints: matchingPoints
    };
}

// Hàm chính để tìm các job phù hợp nhất với CV
async function findMatchingJobs(cv, allJobs, k = 3) {
    if (!cv || !allJobs || allJobs.length === 0) {
        return [];
    }

    // Xây dựng từ điển
    const vocabulary = buildVocabulary(allJobs);

    // Tính điểm matching cho tất cả các jobs
    const jobScores = allJobs.map(job => {
        const { score, matchingPoints } = calculateMatchingScore(cv, job, vocabulary);
        return {
            ...job,
            matchScore: score,
            matchingPoints: matchingPoints
        };
    });

    // Lọc jobs có điểm phù hợp trên 50% và sắp xếp theo điểm giảm dần
    return jobScores
        .filter(job => job.matchScore >= 50) // Chỉ lấy jobs có điểm >= 50%
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, k); // Chỉ lấy 3 jobs có điểm cao nhất
}

// Export các hàm để sử dụng
window.jobRecommendation = {
    findMatchingJobs
}; 