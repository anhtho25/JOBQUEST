    // Import the functions you need from the SDKs you need
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
    import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
    import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
    import { getDatabase, ref, set, onValue, query, orderByChild, equalTo, limitToFirst, get, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

    // Your web app's Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyBxtxHc0J2y4RTPZ5msgygaJYFG8bhyzJE",
        authDomain: "jobquest-29445.firebaseapp.com",
        databaseURL: "https://jobquest-29445-default-rtdb.firebaseio.com",
        projectId: "jobquest-29445",
        storageBucket: "jobquest-29445.firebasestorage.app",
        messagingSenderId: "792726027474",
        appId: "1:792726027474:web:7372c0490c5d7390ebc10b",
        measurementId: "G-3XJ0EENTDJ"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);
    const auth = getAuth(app);
    const database = getDatabase(app);

    // Make Firebase services available globally
    window.firebase = {
        auth,
        database,
        signInWithEmailAndPassword,
        createUserWithEmailAndPassword,
        sendPasswordResetEmail,
        signOut,
        onAuthStateChanged,
        updateProfile,
        ref,
        set,
        onValue,
        query,
        orderByChild,
        equalTo,
        limitToFirst,
        get,
        update,
        serverTimestamp
    };

    // VNPAY configuration
    const vnp_TmnCode = "H69NR8NV"; // Mã website tại VNPAY 
    const vnp_HashSecret = "XK6DQEPQ5KAVJISM374ZZJJN1Q4WW96U"; // Chuỗi bí mật
    const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    const vnp_ReturnUrl = window.location.origin + "/vnpay_return.html"; // URL sau khi thanh toán
    const vnp_IpnUrl = window.location.origin + "/vnpay_ipn.html"; // URL nhận thông báo từ VNPAY

    // Thêm thông tin merchant
    const merchantInfo = {
        email: "ntho0124@gmail.com",
        adminUrl: "https://sandbox.vnpayment.vn/merchantv2/",
        testCaseUrl: "https://sandbox.vnpayment.vn/vnpaygw-sit-testing/user/login"
    };

    // Hàm xử lý chuỗi ký tự cho VNPAY
    function processVNPayString(str) {
        // Đảm bảo giá trị là string và không có khoảng trắng ở đầu/cuối
        const trimmedStr = String(str).trim();
        
        // Thay thế các ký tự đặc biệt trước khi encode
        const preEncodedStr = trimmedStr
            .replace(/\+/g, '%2B')
            .replace(/-/g, '%2D')
            .replace(/\./g, '%2E')
            .replace(/\//g, '%2F')
            .replace(/:/g, '%3A')
            .replace(/=/g, '%3D')
            .replace(/!/g, '%21')
            .replace(/'/g, '%27')
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29')
            .replace(/\*/g, '%2A')
            .replace(/~/g, '%7E')
            .replace(/\s+/g, '+');  // Thay thế khoảng trắng bằng dấu +

        // Encode giá trị
        return encodeURIComponent(preEncodedStr);
    }

    // Hàm tạo URL và chữ ký VNPAY
    function createVNPayUrl(params) {
        // Sắp xếp tham số theo thứ tự alphabet
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((acc, key) => {
                acc[key] = params[key];
                return acc;
            }, {});

        // Tạo chuỗi ký tự cần mã hóa
        const signData = Object.keys(sortedParams)
            .map(key => {
                const value = sortedParams[key];
                const processedValue = processVNPayString(value);
                return `${key}=${processedValue}`;
            })
            .join('&');

        // Debug
        console.log('Sorted params:', sortedParams);
        console.log('Sign data before hash:', signData);

        // Tạo chữ ký
        const hmac = CryptoJS.HmacSHA512(signData, vnp_HashSecret);
        const vnp_SecureHash = hmac.toString(CryptoJS.enc.Hex);

        // Debug
        console.log('Secure hash:', vnp_SecureHash);

        // Thêm chữ ký vào tham số
        sortedParams.vnp_SecureHash = vnp_SecureHash;

        // Tạo URL thanh toán
        const paymentUrl = vnp_Url + '?' + Object.keys(sortedParams)
            .map(key => {
                const value = sortedParams[key];
                const processedValue = processVNPayString(value);
                return `${key}=${processedValue}`;
            })
            .join('&');

        // Debug
        console.log('Final payment URL:', paymentUrl);

        return {
            signData,
            secureHash: vnp_SecureHash,
            paymentUrl
        };
    }

    async function createVNPayPayment(amount) {
        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error('User not logged in');
            }

            const date = new Date();
            const createDate = moment(date).format('YYYYMMDDHHmmss');
            const orderId = `TOPUP_${user.uid.substring(0, 8)}_${Date.now()}`;
            const orderInfo = `Nap tien ${amount.toLocaleString('vi-VN')} VND`;
            const orderType = "other";
            const locale = "vn";
            const currCode = "VND";

            // Format amount to string with leading zeros (minimum 12 digits)
            const formattedAmount = (amount * 100).toString().padStart(12, '0');

            // Lấy địa chỉ IP của người dùng
            let ipAddr = '127.0.0.1';
            try {
                const response = await fetch('https://api.ipify.org?format=json');
                const data = await response.json();
                ipAddr = data.ip;
            } catch (error) {
                console.error('Error fetching IP:', error);
            }

            const vnp_Params = {
                vnp_Version: "2.1.0",
                vnp_Command: "pay",
                vnp_TmnCode: vnp_TmnCode,
                vnp_Locale: locale,
                vnp_CurrCode: currCode,
                vnp_TxnRef: orderId,
                vnp_OrderInfo: orderInfo,
                vnp_OrderType: orderType,
                vnp_Amount: formattedAmount,
                vnp_ReturnUrl: vnp_ReturnUrl,
                vnp_IpnUrl: vnp_IpnUrl,
                vnp_IpAddr: ipAddr,
                vnp_CreateDate: createDate
            };

            // Debug
            console.log('Original params:', vnp_Params);

            // Tạo URL và chữ ký
            const { signData, secureHash, paymentUrl } = createVNPayUrl(vnp_Params);

            // Chuyển hướng đến trang thanh toán VNPAY
            window.location.href = paymentUrl;
        } catch (error) {
            console.error('Error creating VNPAY payment:', error);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: 'Không thể tạo thanh toán VNPAY.',
                showConfirmButton: true
            });
        }
    }

    // Hàm xử lý callback từ VNPAY
    function handleVNPayCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const vnp_ResponseCode = urlParams.get('vnp_ResponseCode');
        const vnp_TransactionNo = urlParams.get('vnp_TransactionNo');
        const vnp_TransactionStatus = urlParams.get('vnp_TransactionStatus');
        const vnp_TxnRef = urlParams.get('vnp_TxnRef');
        const vnp_SecureHash = urlParams.get('vnp_SecureHash');
        const vnp_Amount = urlParams.get('vnp_Amount');

        if (!vnp_TxnRef) return; // Không phải callback từ VNPAY

        // Lấy tất cả các tham số từ URL (trừ vnp_SecureHash)
        const params = {};
        urlParams.forEach((value, key) => {
            if (key !== 'vnp_SecureHash' && key.startsWith('vnp_')) {
                params[key] = value;
            }
        });

        // Sắp xếp tham số theo thứ tự alphabet
        const sortedKeys = Object.keys(params).sort();
        
        // Tạo chuỗi query string để hash
        const signData = sortedKeys
            .map(key => `${key}=${params[key]}`)
            .join('&');

        // Tạo chữ ký với secret key
        const vnp_HashSecret = 'U3I3A1Q4G3Z3MNNJ2NODFKA7G3CBU27P';
        const hmac = CryptoJS.HmacSHA512(signData, vnp_HashSecret);
        const calculatedHash = hmac.toString(CryptoJS.enc.Hex);

        // Xác thực chữ ký
        if (calculatedHash.toLowerCase() === vnp_SecureHash.toLowerCase()) {
            // Chữ ký hợp lệ
            if (vnp_ResponseCode === '00' && vnp_TransactionStatus === '00') {
                // Thanh toán thành công
                const amount = parseInt(vnp_Amount) / 100; // Chuyển về số tiền gốc
                
                // Cập nhật số dư tài khoản
                onAuthStateChanged(auth, function(user) {
                    if (user && vnp_TxnRef.startsWith('TOPUP_' + user.uid.substring(0, 8))) {
                        const userRef = ref(database, `users/${user.uid}`);
                        get(userRef).then((snapshot) => {
                            const userData = snapshot.val();
                            const newBalance = (userData.balance || 0) + amount;

                            // Cập nhật số dư
                            set(ref(database, `users/${user.uid}/balance`), newBalance)
                                .then(() => {
                        Swal.fire({
                            icon: 'success',
                                        title: 'Thanh toán thành công!',
                                        text: `Đã nạp ${amount.toLocaleString('vi-VN')} VNĐ vào tài khoản`,
                                        showConfirmButton: true
                        }).then(() => {
                                        window.location.href = 'member.html';
                                    });
                                })
                                .catch((error) => {
                                    console.error('Error updating balance:', error);
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Lỗi!',
                                        text: 'Không thể cập nhật số dư tài khoản.',
                                        showConfirmButton: true
                                    });
                                });
                        });
                    }
                });
            } else {
                // Thanh toán thất bại
                Swal.fire({
                    icon: 'error',
                    title: 'Thanh toán thất bại!',
                    text: 'Vui lòng thử lại sau.',
                    showConfirmButton: true
                }).then(() => {
                    window.location.href = 'member.html';
                });
            }
        } else {
            // Chữ ký không hợp lệ
            Swal.fire({
                icon: 'error',
                title: 'Lỗi bảo mật!',
                text: 'Chữ ký không hợp lệ.',
                showConfirmButton: true
            }).then(() => {
                window.location.href = 'member.html';
            });
        }
    }

    // Kiểm tra callback VNPAY khi trang load
    if (window.location.search.includes('vnp_ResponseCode')) {
        handleVNPayCallback();
    }

    document.addEventListener('DOMContentLoaded', function() {
        const navbarAccountArea = document.getElementById('navbarAccountArea');
        const { auth, database, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged, updateProfile, ref, set, onValue, query, orderByChild, equalTo, limitToFirst, get, update } = window.firebase;
        
        // Kiểm tra trạng thái đăng nhập
        onAuthStateChanged(auth, function(user) {
            if (user) {
                // Người dùng đã đăng nhập
                navbarAccountArea.innerHTML = `
                    <div class="dropdown" id="accountDropdownWrapper">
                        <a class="btn btn-light dropdown-toggle d-flex align-items-center" href="#" id="accountDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                            <img src="${user.photoURL || 'images/default-avatar.jpg'}" alt="Avatar" class="rounded-circle me-2" width="32" height="32">
                            <span id="accountName">${user.displayName || user.email}</span>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="accountDropdown">
                            <li><a class="dropdown-item" href="#"><i class="fa fa-file-alt me-2"></i>Trang quản lý</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" id="logoutBtn"><i class="fa fa-sign-out-alt me-2"></i>Đăng xuất</a></li>
                        </ul>
                    </div>
                `;

                // Xử lý đăng xuất
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.onclick = function(e) {
                        e.preventDefault();
                        Swal.fire({
                            title: 'Xác nhận đăng xuất?',
                            text: "Bạn có chắc chắn muốn đăng xuất?",
                            icon: 'question',
                            showCancelButton: true,
                            confirmButtonColor: '#3085d6',
                            cancelButtonColor: '#d33',
                            confirmButtonText: 'Đăng xuất',
                            cancelButtonText: 'Hủy'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                signOut(auth).then(() => {
                                    Swal.fire({
                                        title: 'Đã đăng xuất!',
                                        text: 'Bạn đã đăng xuất thành công.',
                                        icon: 'success',
                                        timer: 1500
                                    }).then(() => {
                                        window.location.href = 'index.html'; // Chuyển hướng về trang chủ
                                    });
                                }).catch((error) => {
                                    console.error('Lỗi đăng xuất:', error);
                                    Swal.fire({
                                        title: 'Lỗi!',
                                        text: 'Có lỗi xảy ra khi đăng xuất.',
                                        icon: 'error'
                                    });
                                });
                            }
                        });
                    }
                }
            } else {
                // Người dùng chưa đăng nhập
                navbarAccountArea.innerHTML = `
                    <a class="btn btn-primary me-2" href="#" data-bs-toggle="modal" data-bs-target="#registerModal">Đăng ký</a>
                    <a class="btn btn-light" href="#" data-bs-toggle="modal" data-bs-target="#loginModal">Đăng nhập</a>
                `;
            }
        });

        // Xử lý form đăng nhập
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                
                signInWithEmailAndPassword(auth, email, password)
                    .then((userCredential) => {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                        modal.hide();
                        Swal.fire({
                            title: 'Đăng nhập thành công!',
                            text: 'Chào mừng bạn quay trở lại.',
                            icon: 'success',
                            timer: 1500
                        }).then(() => {
                            window.location.reload();
                        });
                    })
                    .catch((error) => {
                        let errorMessage = 'Đăng nhập thất bại!';
                        switch (error.code) {
                            case 'auth/user-not-found':
                                errorMessage = 'Email không tồn tại!';
                                break;
                            case 'auth/wrong-password':
                                errorMessage = 'Mật khẩu không đúng!';
                                break;
                            case 'auth/invalid-email':
                                errorMessage = 'Email không hợp lệ!';
                                break;
                        }
                        Swal.fire({
                            title: 'Lỗi!',
                            text: errorMessage,
                            icon: 'error'
                        });
                    });
            });
        }

        // Xử lý form đăng ký
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const name = document.getElementById('registerName').value;
                const email = document.getElementById('registerEmail').value;
                const password = document.getElementById('registerPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                const userType = document.querySelector('input[name="userType"]:checked').value;

                if (password !== confirmPassword) {
                    Swal.fire({
                        title: 'Lỗi!',
                        text: 'Mật khẩu xác nhận không khớp!',
                        icon: 'error'
                    });
                    return;
                }

                // Hiển thị loading
                Swal.fire({
                    title: 'Đang xử lý...',
                    text: 'Vui lòng chờ trong giây lát',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                createUserWithEmailAndPassword(auth, email, password)
                    .then((userCredential) => {
                        // Cập nhật thông tin người dùng
                        return updateProfile(userCredential.user, {
                            displayName: name
                        }).then(() => {
                            // Lưu thông tin bổ sung vào Realtime Database
                            const userRef = ref(database, 'users/' + userCredential.user.uid);
                            return set(userRef, {
                                name: name,
                                email: email,
                                role: userType,
                                createdAt: new Date().toISOString()
                            }).catch((error) => {
                                console.error('Database error:', error);
                                // Nếu lỗi database, vẫn cho phép đăng ký thành công
                                return Promise.resolve();
                            });
                        });
                    })
                    .then(() => {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
                        modal.hide();
                        Swal.fire({
                            title: 'Đăng ký thành công!',
                            text: 'Chào mừng bạn đến với JOBQUEST.',
                            icon: 'success',
                            timer: 1500
                        }).then(() => {
                            window.location.reload();
                        });
                    })
                    .catch((error) => {
                        console.error('Registration error:', error);
                        let errorMessage = 'Đăng ký thất bại!';
                        switch (error.code) {
                            case 'auth/email-already-in-use':
                                errorMessage = 'Email này đã được sử dụng!';
                                break;
                            case 'auth/invalid-email':
                                errorMessage = 'Email không hợp lệ!';
                                break;
                            case 'auth/weak-password':
                                errorMessage = 'Mật khẩu phải có ít nhất 6 ký tự!';
                                break;
                            case 'auth/network-request-failed':
                                errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra lại kết nối của bạn!';
                                break;
                            case 'auth/too-many-requests':
                                errorMessage = 'Quá nhiều yêu cầu. Vui lòng thử lại sau!';
                                break;
                            case 'PERMISSION_DENIED':
                                errorMessage = 'Không có quyền truy cập. Vui lòng liên hệ admin!';
                                break;
                            default:
                                errorMessage = `Lỗi: ${error.message}`;
                        }
                        Swal.fire({
                            title: 'Lỗi!',
                            text: errorMessage,
                            icon: 'error',
                            confirmButtonText: 'Thử lại'
                        });
                    });
            });
        }

        // Xử lý form quên mật khẩu
        const forgotPasswordForm = document.getElementById('forgotPasswordForm');
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const email = document.getElementById('forgotEmail').value;
                
                sendPasswordResetEmail(auth, email)
                    .then(() => {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal'));
                        modal.hide();
                        Swal.fire({
                            title: 'Thành công!',
                            text: 'Link đặt lại mật khẩu đã được gửi vào email của bạn.',
                            icon: 'success',
                            timer: 3000
                        });
                    })
                    .catch((error) => {
                        let errorMessage = 'Gửi email thất bại!';
                        switch (error.code) {
                            case 'auth/user-not-found':
                                errorMessage = 'Email không tồn tại trong hệ thống!';
                                break;
                            case 'auth/invalid-email':
                                errorMessage = 'Email không hợp lệ!';
                                break;
                        }
                        Swal.fire({
                            title: 'Lỗi!',
                            text: errorMessage,
                            icon: 'error'
                        });
                    });
            });
        }

        // Hiển thị tin tuyển dụng mới nhất từ Firebase Realtime Database
        const latestJobs = document.getElementById('latestJobs');
        if (latestJobs) {
            const jobsRef = ref(database, 'jobs');
            const jobsQuery = query(jobsRef, orderByChild('status'), equalTo('approved'), limitToFirst(6));
            
            onValue(jobsQuery, (snapshot) => {
                const jobs = [];
                snapshot.forEach((childSnapshot) => {
                    jobs.push({ id: childSnapshot.key, ...childSnapshot.val() });
                });

                if (jobs.length === 0) {
                    latestJobs.innerHTML = '<div class="col-12 text-center text-muted">Chưa có tin tuyển dụng nào.</div>';
                } else {
                    latestJobs.innerHTML = jobs.map(job => `
                        <div class="col-md-6 col-lg-4 mb-4">
                            <div class="card h-100 shadow-sm">
                                <div class="card-body">
                                    <h5 class="card-title">${job.title}</h5>
                                    <div class="mb-2"><span class="badge bg-primary">${job.category}</span> <span class="badge bg-info">${job.type}</span></div>
                                    <p class="mb-1"><i class="fa fa-building me-2"></i>${job.employer || 'Nhà tuyển dụng'}</p>
                                    <p class="mb-1"><i class="fa fa-map-marker-alt me-2"></i>${job.contactAddress}</p>
                                    <p class="mb-1"><i class="fa fa-money-bill-wave me-2"></i>${Number(job.salaryMin).toLocaleString()} - ${Number(job.salaryMax).toLocaleString()} ${job.salaryType.toUpperCase()}</p>
                                    <p class="mb-1"><i class="fa fa-calendar me-2"></i>Hạn nộp: ${job.deadline}</p>
                                </div>
                                <div class="card-footer bg-white border-0 d-flex justify-content-between align-items-center">
                                    <small class="text-muted">${job.date || ''}</small>
                                    <span class="badge bg-success">${job.status}</span>
                                </div>
                            </div>
                        </div>
                    `).join('');
                }
            });
        }

        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileRole = document.getElementById('profileRole');
        const profileAvatar = document.getElementById('profileAvatar');
        const companyInfo = document.getElementById('companyInfo');

        onAuthStateChanged(auth, function(user) {
            if (user) {
                const userRef = ref(database, 'users/' + user.uid);
                onValue(userRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const data = snapshot.val();
                        profileName.textContent = data.name || user.displayName || 'Chưa cập nhật';
                        profileEmail.textContent = data.email || user.email || '';
                        profileRole.textContent = data.role === 'employer' ? 'Nhà tuyển dụng' : 'Ứng viên';
                        if (user.photoURL) {
                            profileAvatar.src = user.photoURL;
                        }
                        // Hiển thị menu dựa trên role
                        const sidebarMenu = document.getElementById('sidebarMenu');
                        if (data.role === 'employer') {
                            sidebarMenu.innerHTML = `
                                <a href="#" class="list-group-item list-group-item-action active" data-section="generalManagement">
                                    <i class="fas fa-cog me-2"></i> Quản lý chung
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="accountManagement">
                                    <i class="fas fa-wallet me-2"></i> Tài khoản & Nạp tiền
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="companyManagement">
                                    <i class="fas fa-building me-2"></i> Quản lý công ty
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="jobPosting">
                                    <i class="fas fa-briefcase me-2"></i> Đăng tin tuyển dụng
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="candidateManagement">
                                    <i class="fas fa-users me-2"></i> Quản lý ứng viên
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="messageManagement">
                                    <i class="fas fa-envelope me-2"></i> Tin nhắn
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="reportManagement">
                                    <i class="fas fa-chart-bar me-2"></i> Báo cáo thống kê
                                </a>
                            `;

                            // Thêm event listeners cho menu items
                            setupMenuNavigation(data.role);
                        } else {
                            sidebarMenu.innerHTML = `
                                <a href="#" class="list-group-item list-group-item-action active" data-section="generalManagement">
                                    <i class="fas fa-cog me-2"></i> Quản lý chung
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="cvManagement">
                                    <i class="fas fa-file-alt me-2"></i> Quản lý CV
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="aiJobSuggestions">
                                    <i class="fas fa-robot me-2"></i> Việc làm AI gợi ý <span class="badge bg-danger ms-2">NEW</span>
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="coverLetterManagement">
                                    <i class="fas fa-envelope me-2"></i> Quản lý Cover Letter
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="appliedJobsManagement">
                                    <i class="fas fa-briefcase me-2"></i> Việc làm đã ứng tuyển
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="savedJobsManagement">
                                    <i class="fas fa-star me-2"></i> Việc làm đã lưu
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="candidateMessages">
                                    <i class="fas fa-comments me-2"></i> Tin nhắn
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="profileViews">
                                    <i class="fas fa-eye me-2"></i> NTD đã xem hồ sơ
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="notificationSettings">
                                    <i class="fas fa-bell me-2"></i> Cài đặt thông báo việc làm
                                </a>
                            `;
                            // Thêm event listeners cho menu items
                            setupMenuNavigation(data.role);
                        }

                        // Hiển thị thông tin công ty nếu là employer
                        if (data.role === 'employer' && data.company) {
                            companyInfo.style.display = 'block';
                            companyInfo.innerHTML = `
                                <hr>
                                <div class='text-start'>
                                    <strong>Công ty:</strong> ${data.company.name || ''}<br>
                                    <strong>Địa chỉ:</strong> ${data.company.address || ''}<br>
                                    <strong>Điện thoại:</strong> ${data.company.phone || ''}<br>
                                    <strong>Website:</strong> <a href='${data.company.website || '#'}' target='_blank'>${data.company.website || ''}</a><br>
                                    <strong>Mô tả:</strong> <span class='small'>${data.company.description || ''}</span>
                                </div>
                            `;
                        } else {
                            companyInfo.style.display = 'none';
                            companyInfo.innerHTML = '';
                        }

                        // Hiển thị thống kê dựa trên role
                        const statisticsCards = document.getElementById('statisticsCards');
                        if (data.role === 'employer') {
                            // Gọi hàm cập nhật thống kê trước khi hiển thị
                            updateEmployerStatistics(user.uid);
                        }
                    }
                }, { onlyOnce: true });
            } else {
                profileName.textContent = 'Chưa đăng nhập';
                profileEmail.textContent = '';
                profileRole.textContent = '';
                companyInfo.style.display = 'none';
                companyInfo.innerHTML = '';
            }
        });

        // Thêm vào cuối của onAuthStateChanged callback
        onAuthStateChanged(auth, function(user) {
            if (user) {
                const userRef = ref(database, 'users/' + user.uid);
                onValue(userRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const data = snapshot.val();
                        // ...existing code...
                        
                        // Hiển thị menu dựa trên role
                        const sidebarMenu = document.getElementById('sidebarMenu');
                        if (data.role === 'employer') {
                            sidebarMenu.innerHTML = `
                                <a href="#" class="list-group-item list-group-item-action active" data-section="generalManagement">
                                    <i class="fas fa-cog me-2"></i> Quản lý chung
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="accountManagement">
                                    <i class="fas fa-wallet me-2"></i> Tài khoản & Nạp tiền
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="companyManagement">
                                    <i class="fas fa-building me-2"></i> Quản lý công ty
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="jobPosting">
                                    <i class="fas fa-briefcase me-2"></i> Đăng tin tuyển dụng
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="candidateManagement">
                                    <i class="fas fa-users me-2"></i> Quản lý ứng viên
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="messageManagement">
                                    <i class="fas fa-envelope me-2"></i> Tin nhắn
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="notificationManagement">
                                    <i class="fas fa-bell me-2"></i> Thông báo
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="reportManagement">
                                    <i class="fas fa-chart-bar me-2"></i> Báo cáo thống kê
                                </a>
                            `;

                            // Thêm event listeners cho menu items
                            setupMenuNavigation(data.role);
                        } else {
                            sidebarMenu.innerHTML = `
                                <a href="#" class="list-group-item list-group-item-action active" data-section="generalManagement">
                                    <i class="fas fa-cog me-2"></i> Quản lý chung
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="cvManagement">
                                    <i class="fas fa-file-alt me-2"></i> Quản lý CV
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="aiJobSuggestions">
                                    <i class="fas fa-robot me-2"></i> Việc làm AI gợi ý <span class="badge bg-danger ms-2">NEW</span>
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="coverLetterManagement">
                                    <i class="fas fa-envelope me-2"></i> Quản lý Cover Letter
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="appliedJobsManagement">
                                    <i class="fas fa-briefcase me-2"></i> Việc làm đã ứng tuyển
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="savedJobsManagement">
                                    <i class="fas fa-star me-2"></i> Việc làm đã lưu
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="candidateMessages">
                                    <i class="fas fa-comments me-2"></i> Tin nhắn
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="profileViews">
                                    <i class="fas fa-eye me-2"></i> NTD đã xem hồ sơ
                                </a>
                                <a href="#" class="list-group-item list-group-item-action" data-section="notificationSettings">
                                    <i class="fas fa-bell me-2"></i> Cài đặt thông báo việc làm
                                </a>
                            `;
                            // Thêm event listeners cho menu items
                            setupMenuNavigation(data.role);
                        }

                        // Hiển thị thông tin công ty nếu là employer
                        if (data.role === 'employer' && data.company) {
                            companyInfo.style.display = 'block';
                            companyInfo.innerHTML = `
                                <hr>
                                <div class='text-start'>
                                    <strong>Công ty:</strong> ${data.company.name || ''}<br>
                                    <strong>Địa chỉ:</strong> ${data.company.address || ''}<br>
                                    <strong>Điện thoại:</strong> ${data.company.phone || ''}<br>
                                    <strong>Website:</strong> <a href='${data.company.website || '#'}' target='_blank'>${data.company.website || ''}</a><br>
                                    <strong>Mô tả:</strong> <span class='small'>${data.company.description || ''}</span>
                                </div>
                            `;
                        } else {
                            companyInfo.style.display = 'none';
                            companyInfo.innerHTML = '';
                        }

                        // Hiển thị thống kê dựa trên role
                        const statisticsCards = document.getElementById('statisticsCards');
                        if (data.role === 'employer') {
                            // Gọi hàm cập nhật thống kê trước khi hiển thị
                            updateEmployerStatistics(user.uid);
                        }
                    }
                }, { onlyOnce: true });
            } else {
                profileName.textContent = 'Chưa đăng nhập';
                profileEmail.textContent = '';
                profileRole.textContent = '';
                companyInfo.style.display = 'none';
                companyInfo.innerHTML = '';
            }
        });

        // Hàm setup navigation cho menu
        function setupMenuNavigation(userRole) {
            const menuItems = document.querySelectorAll('#sidebarMenu .list-group-item');
            const contentSections = document.querySelectorAll('.content-section');

            menuItems.forEach(item => {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // Remove active class from all menu items
                    menuItems.forEach(mi => mi.classList.remove('active'));
                    
                    // Add active class to clicked item
                    this.classList.add('active');
                    
                    // Hide all content sections
                    contentSections.forEach(section => {
                        section.style.display = 'none';
                    });
                    
                    // Show selected section
                    const sectionId = this.getAttribute('data-section');
                    if (sectionId) {
                        const targetSection = document.getElementById(sectionId);
                        if (targetSection) {
                            targetSection.style.display = 'block';
                            
                            // Load specific content based on section
                            loadSectionContent(sectionId, userRole);
                        }
                    }
                });
            });
        }

        // Hàm load nội dung cho từng section
        function loadSectionContent(sectionId, userRole) {
            const { auth, database, ref, onValue, set, query, orderByChild, equalTo } = window.firebase;
            const user = auth.currentUser;
            
            if (!user) return;

            switch(sectionId) {
                case 'companyManagement':
                    loadCompanyInfo(user.uid);
                    break;
                case 'candidateManagement':
                    loadCandidates(user.uid);
                    break;
                case 'messageManagement':
                    loadMessages(user.uid);
                    break;
                case 'notificationManagement':
                    loadNotifications(user.uid);
                    break;
                case 'reportManagement':
                    loadReports(user.uid);
                    break;
                // Candidate sections
                case 'cvManagement':
                    loadCVList(user.uid);
                    break;
                case 'aiJobSuggestions':
                    loadAIJobSuggestions(user.uid);
                    break;
                case 'coverLetterManagement':
                    loadCoverLetters(user.uid);
                    break;
                case 'appliedJobsManagement':
                    loadAppliedJobs(user.uid);
                    break;
                case 'savedJobsManagement':
                    loadSavedJobs(user.uid);
                    break;
                case 'candidateMessages':
                    loadCandidateMessages(user.uid);
                    break;
                case 'profileViews':
                    loadProfileViews(user.uid);
                    break;
                case 'notificationSettings':
                    loadNotificationSettings(user.uid);
                    break;
                case 'accountManagement':
                    loadAccountInfo(user.uid);
                    break;
            }
        }

        // Load thông tin công ty
        function loadCompanyInfo(userId) {
            const userRef = ref(database, 'users/' + userId);
            onValue(userRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    if (data.company) {
                        document.getElementById('companyName').value = data.company.name || '';
                        document.getElementById('companyPhone').value = data.company.phone || '';
                        document.getElementById('companyEmail').value = data.company.email || '';
                        document.getElementById('companyWebsite').value = data.company.website || '';
                        document.getElementById('companyAddress').value = data.company.address || '';
                        document.getElementById('companyDescription').value = data.company.description || '';
                    }
                }
            }, { onlyOnce: true });
        }

        // Xử lý form cập nhật công ty
        const companyForm = document.getElementById('companyForm');
        if (companyForm) {
            companyForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const user = auth.currentUser;
                if (!user) return;

                const companyData = {
                    name: document.getElementById('companyName').value,
                    phone: document.getElementById('companyPhone').value,
                    email: document.getElementById('companyEmail').value,
                    website: document.getElementById('companyWebsite').value,
                    address: document.getElementById('companyAddress').value,
                    description: document.getElementById('companyDescription').value
                };

                const userRef = ref(database, 'users/' + user.uid + '/company');
                set(userRef, companyData).then(() => {
                    Swal.fire({
                        title: 'Thành công!',
                        text: 'Thông tin công ty đã được cập nhật.',
                        icon: 'success',
                        timer: 1500
                    });
                }).catch(error => {
                    Swal.fire({
                        title: 'Lỗi!',
                        text: 'Có lỗi xảy ra khi cập nhật thông tin.',
                        icon: 'error'
                    });
                });
            });
        }

        // Xử lý form đăng tin tuyển dụng
        const jobPostForm = document.getElementById('jobPostForm');
        if (jobPostForm) {
            jobPostForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const user = auth.currentUser;
                if (!user) return;

                // Kiểm tra số dư tài khoản
                const userRef = ref(database, 'users/' + user.uid);
                const userSnapshot = await get(userRef);
                const userData = userSnapshot.val();
                const currentBalance = userData.balance || 0;
                const postingFee = 50000; // Phí đăng tin: 50,000 VNĐ

                if (currentBalance < postingFee) {
                    Swal.fire({
                        title: 'Số dư không đủ!',
                        text: 'Bạn cần nạp thêm tiền để đăng tin tuyển dụng. Phí đăng tin: 50,000 VNĐ',
                        icon: 'error',
                        showCancelButton: true,
                        confirmButtonText: 'Nạp tiền ngay',
                        cancelButtonText: 'Để sau'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            // Chuyển đến trang nạp tiền
                            document.querySelector('[data-section="wallet"]').click();
                        }
                    });
                    return;
                }

                const jobData = {
                    title: document.getElementById('jobTitle').value,
                    type: document.getElementById('jobType').value,
                    category: document.getElementById('jobCategory').value,
                    salaryMin: document.getElementById('jobSalaryMin').value,
                    salaryMax: document.getElementById('jobSalaryMax').value,
                    salaryType: 'vnd',
                    contactAddress: document.getElementById('jobLocation').value,
                    deadline: document.getElementById('jobDeadline').value,
                    description: document.getElementById('jobDescription').value,
                    requirements: document.getElementById('jobRequirements').value,
                    benefits: document.getElementById('jobBenefits').value,
                    employerId: user.uid,
                    status: 'approved', // Thay đổi từ 'pending' thành 'approved'
                    date: new Date().toISOString().split('T')[0],
                    createdAt: new Date().toISOString()
                };

                // Hiển thị xác nhận trước khi đăng tin
                const result = await Swal.fire({
                    title: 'Xác nhận đăng tin',
                    html: `
                        <div class="text-start">
                            <p><strong>Tiêu đề:</strong> ${jobData.title}</p>
                            <p><strong>Phí đăng tin:</strong> 50,000 VNĐ</p>
                            <p><strong>Số dư hiện tại:</strong> ${currentBalance.toLocaleString()} VNĐ</p>
                            <p><strong>Số dư còn lại:</strong> ${(currentBalance - postingFee).toLocaleString()} VNĐ</p>
                        </div>
                    `,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Xác nhận đăng tin',
                    cancelButtonText: 'Hủy'
                });

                if (!result.isConfirmed) {
                    return;
                }

                try {
                    // Hiển thị loading
                    Swal.fire({
                        title: 'Đang xử lý...',
                        text: 'Vui lòng chờ trong giây lát',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    // Tạo transaction ID
                    const transactionId = `POST_${user.uid.slice(0, 8)}_${Date.now()}`;
                    
                    // Tạo tin tuyển dụng mới
                    const jobsRef = ref(database, 'jobs');
                    const newJobRef = ref(database, 'jobs/' + Date.now());
                    
                    // Cập nhật số dư và thêm transaction
                    const updates = {};
                    updates[`users/${user.uid}/balance`] = currentBalance - postingFee;
                    updates[`users/${user.uid}/transactions/${transactionId}`] = {
                        amount: -postingFee,
                        type: 'job_posting',
                        status: 'completed',
                        createdAt: new Date().toISOString(),
                        jobId: newJobRef.key,
                        description: `Phí đăng tin tuyển dụng: ${jobData.title}`
                    };
                    
                    // Thực hiện cập nhật đồng thời
                    await set(newJobRef, jobData);
                    await update(ref(database), updates);

                    Swal.fire({
                        title: 'Thành công!',
                        text: 'Tin tuyển dụng đã được đăng thành công.',
                        icon: 'success',
                        timer: 2000
                    }).then(() => {
                        jobPostForm.reset();
                    });
                } catch (error) {
                    console.error('Error posting job:', error);
                    Swal.fire({
                        title: 'Lỗi!',
                        text: 'Có lỗi xảy ra khi đăng tin.',
                        icon: 'error'
                    });
                }
            });
        }

        function loadCandidates(userId) {
            const { database, ref, get, query, orderByChild, equalTo } = window.firebase;
            
            // Lấy danh sách tin tuyển dụng của nhà tuyển dụng
            const jobsRef = ref(database, 'jobs');
            const jobsQuery = query(jobsRef, orderByChild('employerId'), equalTo(userId));
            
            get(jobsQuery).then(async (jobsSnapshot) => {
                if (!jobsSnapshot.exists()) {
                    document.getElementById('candidatesList').innerHTML = `
                        <div class="text-center text-muted py-4">
                            <i class="fas fa-users fa-3x mb-3"></i>
                            <p>Chưa có ứng viên nào ứng tuyển</p>
                        </div>
                    `;
                    return;
                }

                // Lấy tất cả ứng viên từ các tin tuyển dụng
                const allApplications = [];
                const jobs = [];
                jobsSnapshot.forEach((jobSnapshot) => {
                    const job = jobSnapshot.val();
                    job.id = jobSnapshot.key;
                    jobs.push(job);
                });

                // Lấy danh sách ứng viên cho mỗi tin
                for (const job of jobs) {
                    const applicationsRef = ref(database, `applications/${job.id}`);
                    const applicationsSnapshot = await get(applicationsRef);
                    
                    if (applicationsSnapshot.exists()) {
                        applicationsSnapshot.forEach((applicationSnapshot) => {
                            const application = applicationSnapshot.val();
                            application.id = applicationSnapshot.key;
                            application.jobTitle = job.title;
                            allApplications.push(application);
                        });
                    }
                }

                if (allApplications.length === 0) {
                    document.getElementById('candidatesList').innerHTML = `
                        <div class="text-center text-muted py-4">
                            <i class="fas fa-users fa-3x mb-3"></i>
                            <p>Chưa có ứng viên nào ứng tuyển</p>
                        </div>
                    `;
                    return;
                }

                // Sắp xếp ứng viên theo thời gian ứng tuyển mới nhất
                allApplications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

                // Hiển thị danh sách ứng viên
                document.getElementById('candidatesList').innerHTML = `
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Ứng viên</th>
                                    <th>Vị trí ứng tuyển</th>
                                    <th>Ngày ứng tuyển</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${allApplications.map(application => `
                                    <tr>
                                        <td>
                                            <div>
                                                <strong>${application.candidateName}</strong>
                                                <br>
                                                <small class="text-muted">${application.candidateEmail}</small>
                                            </div>
                                        </td>
                                        <td>${application.jobTitle}</td>
                                        <td>${new Date(application.appliedAt).toLocaleDateString('vi-VN')}</td>
                                        <td>
                                            <span class="badge ${getStatusBadgeClass(application.status)}">
                                                ${getStatusText(application.status)}
                                            </span>
                                        </td>
                                        <td>
                                            <div class="btn-group">
                                                <button class="btn btn-sm btn-outline-primary" onclick="viewApplication('${application.jobId}', '${application.candidateId}')">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-success" onclick="updateApplicationStatus('${application.jobId}', '${application.candidateId}', 'accepted')">
                                                    <i class="fas fa-check"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-danger" onclick="updateApplicationStatus('${application.jobId}', '${application.candidateId}', 'rejected')">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }).catch((error) => {
                console.error('Error loading candidates:', error);
                document.getElementById('candidatesList').innerHTML = `
                    <div class="alert alert-danger">
                        Có lỗi xảy ra khi tải danh sách ứng viên
                    </div>
                `;
            });
        }

        // Hàm hỗ trợ lấy class cho badge trạng thái
        function getStatusBadgeClass(status) {
            switch (status) {
                case 'pending':
                    return 'bg-warning';
                case 'accepted':
                    return 'bg-success';
                case 'rejected':
                    return 'bg-danger';
                default:
                    return 'bg-secondary';
            }
        }

        // Hàm hỗ trợ lấy text hiển thị trạng thái
        function getStatusText(status) {
            switch (status) {
                case 'pending':
                    return 'Chờ duyệt';
                case 'accepted':
                    return 'Đã duyệt';
                case 'rejected':
                    return 'Từ chối';
                default:
                    return 'Không xác định';
            }
        }

        // Hàm xem chi tiết ứng tuyển
        window.viewApplication = function(jobId, candidateId) {
            const { database, ref, get } = window.firebase;
            const applicationRef = ref(database, `applications/${jobId}/${candidateId}`);
            
            get(applicationRef).then((snapshot) => {
                if (!snapshot.exists()) {
                    Swal.fire({
                        title: 'Lỗi!',
                        text: 'Không tìm thấy thông tin ứng tuyển',
                        icon: 'error'
                    });
                    return;
                }

                const application = snapshot.val();
                
                Swal.fire({
                    title: 'Chi tiết ứng tuyển',
                    html: `
                        <div class="text-start">
                            <h6>Thông tin ứng viên:</h6>
                            <p><strong>Họ tên:</strong> ${application.candidateName}</p>
                            <p><strong>Email:</strong> ${application.candidateEmail}</p>
                            ${application.cvLink ? `<p><strong>CV:</strong> <a href="${application.cvLink}" target="_blank">Xem CV</a></p>` : ''}
                            
                            <h6 class="mt-4">Thư giới thiệu:</h6>
                            <div class="border rounded p-3 bg-light">
                                <pre style="white-space: pre-wrap;">${application.coverLetter}</pre>
                            </div>
                            
                            <h6 class="mt-4">Thông tin khác:</h6>
                            <p><strong>Ngày ứng tuyển:</strong> ${new Date(application.appliedAt).toLocaleString('vi-VN')}</p>
                            <p><strong>Trạng thái:</strong> <span class="badge ${getStatusBadgeClass(application.status)}">${getStatusText(application.status)}</span></p>
                        </div>
                    `,
                    width: '600px',
                    confirmButtonText: 'Đóng'
                });
            });
        }

        // Hàm cập nhật trạng thái ứng tuyển
        window.updateApplicationStatus = function(jobId, candidateId, newStatus) {
            const { database, ref, update } = window.firebase;
            const applicationRef = ref(database, `applications/${jobId}/${candidateId}`);
            
            const statusText = newStatus === 'accepted' ? 'duyệt' : 'từ chối';
            
            Swal.fire({
                title: 'Xác nhận',
                text: `Bạn có chắc chắn muốn ${statusText} ứng viên này?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Xác nhận',
                cancelButtonText: 'Hủy'
            }).then((result) => {
                if (result.isConfirmed) {
                    update(applicationRef, {
                        status: newStatus,
                        updatedAt: new Date().toISOString()
                    }).then(() => {
                        Swal.fire({
                            title: 'Thành công!',
                            text: `Đã ${statusText} ứng viên`,
                            icon: 'success',
                            timer: 1500
                        }).then(() => {
                            // Reload danh sách ứng viên
                            loadCandidates(auth.currentUser.uid);
                        });
                    }).catch((error) => {
                        console.error('Error updating application status:', error);
                        Swal.fire({
                            title: 'Lỗi!',
                            text: `Không thể ${statusText} ứng viên`,
                            icon: 'error'
                        });
                    });
                }
            });
        }

        function loadMessages(userId) {
            const { database, ref, get, query, orderByChild, equalTo, onValue } = window.firebase;
            const conversationsList = document.getElementById('conversationsList');
            const messagesList = document.getElementById('messagesList');
            const messageInput = document.getElementById('messageInput');
            const sendMessageBtn = document.getElementById('sendMessageBtn');
            
            // Đầu tiên, lấy danh sách tin tuyển dụng của nhà tuyển dụng
            const jobsRef = ref(database, 'jobs');
            const jobsQuery = query(jobsRef, orderByChild('employerId'), equalTo(userId));
            
            get(jobsQuery).then(async (jobsSnapshot) => {
                if (!jobsSnapshot.exists()) {
                    conversationsList.innerHTML = `
                        <div class="text-center text-muted py-4">
                            <i class="fas fa-comments fa-3x mb-3"></i>
                            <p>Chưa có tin nhắn nào</p>
                        </div>
                    `;
                    return;
                }

                // Lấy tất cả ứng viên đã được duyệt từ các tin tuyển dụng
                const approvedCandidates = [];
                const jobs = [];
                jobsSnapshot.forEach((jobSnapshot) => {
                    const job = jobSnapshot.val();
                    job.id = jobSnapshot.key;
                    jobs.push(job);
                });

                // Lấy danh sách ứng viên được duyệt cho mỗi tin
                for (const job of jobs) {
                    const applicationsRef = ref(database, `applications/${job.id}`);
                    const applicationsSnapshot = await get(applicationsRef);
                    
                    if (applicationsSnapshot.exists()) {
                        applicationsSnapshot.forEach((applicationSnapshot) => {
                            const application = applicationSnapshot.val();
                            if (application.status === 'accepted') {
                                approvedCandidates.push({
                                    candidateId: application.candidateId,
                                    candidateName: application.candidateName,
                                    candidateEmail: application.candidateEmail,
                                    jobId: job.id,
                                    jobTitle: job.title,
                                    appliedAt: application.appliedAt
                                });
                            }
                        });
                    }
                }

                if (approvedCandidates.length === 0) {
                    conversationsList.innerHTML = `
                        <div class="text-center text-muted py-4">
                            <i class="fas fa-comments fa-3x mb-3"></i>
                            <p>Chưa có ứng viên nào được duyệt</p>
                        </div>
                    `;
                    return;
                }

                // Hiển thị danh sách ứng viên được duyệt
                conversationsList.innerHTML = approvedCandidates.map(candidate => `
                    <a href="#" class="list-group-item list-group-item-action conversation-item" 
                       data-candidate-id="${candidate.candidateId}"
                       data-job-id="${candidate.jobId}">
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1">${candidate.candidateName}</h6>
                            <small class="text-muted unread-count"></small>
                        </div>
                        <p class="mb-1 small text-truncate">${candidate.jobTitle}</p>
                        <small class="text-muted">
                            <i class="fas fa-clock me-1"></i>${moment(candidate.appliedAt).fromNow()}
                        </small>
                    </a>
                `).join('');

                // Xử lý sự kiện click vào hội thoại
                const conversationItems = document.querySelectorAll('.conversation-item');
                conversationItems.forEach(item => {
                    item.addEventListener('click', function(e) {
                        e.preventDefault();
                        
                        // Remove active class from all items
                        conversationItems.forEach(i => i.classList.remove('active'));
                        // Add active class to clicked item
                        this.classList.add('active');

                        const candidateId = this.dataset.candidateId;
                        const jobId = this.dataset.jobId;
                        
                        // Load tin nhắn của hội thoại được chọn
                        loadConversationMessages(userId, candidateId, jobId);
                    });
                });

                // Xử lý gửi tin nhắn
                sendMessageBtn.onclick = function() {
                    const activeConversation = document.querySelector('.conversation-item.active');
                    if (!activeConversation || !messageInput.value.trim()) return;

                    const candidateId = activeConversation.dataset.candidateId;
                    const jobId = activeConversation.dataset.jobId;
                    const messageText = messageInput.value.trim();

                    // Tạo tin nhắn mới
                    const messagesRef = ref(database, `messages/${jobId}/${candidateId}`);
                    const newMessageRef = ref(database, `messages/${jobId}/${candidateId}/${Date.now()}`);
                    set(newMessageRef, {
                        senderId: userId,
                        text: messageText,
                        timestamp: serverTimestamp(), // Sử dụng server timestamp
                        isRead: false
                    }).then(() => {
                        messageInput.value = '';
                        messageInput.focus();
                    }).catch(error => {
                        console.error('Error sending message:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Lỗi!',
                            text: 'Không thể gửi tin nhắn.'
                        });
                    });
                };

                // Xử lý gửi tin nhắn khi nhấn Enter
                messageInput.onkeypress = function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        sendMessageBtn.click();
                    }
                };
            }).catch(error => {
                console.error('Error loading messages:', error);
                conversationsList.innerHTML = `
                    <div class="alert alert-danger">
                        Có lỗi xảy ra khi tải tin nhắn
                    </div>
                `;
            });
        }

        // Hàm load tin nhắn của một hội thoại
        function loadConversationMessages(userId, candidateId, jobId) {
            const { database, ref, onValue } = window.firebase;
            const messagesList = document.getElementById('messagesList');
            const messagesRef = ref(database, `messages/${jobId}/${candidateId}`);

            // Hiển thị loading
            messagesList.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Đang tải...</span>
                    </div>
                </div>
            `;

            onValue(messagesRef, (snapshot) => {
                if (!snapshot.exists()) {
                    messagesList.innerHTML = `
                        <div class="text-center text-muted py-4">
                            <p>Chưa có tin nhắn nào</p>
                            <small>Hãy bắt đầu cuộc trò chuyện</small>
                        </div>
                    `;
                    return;
                }

                const messages = [];
                snapshot.forEach((childSnapshot) => {
                    messages.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });

                // Sắp xếp tin nhắn theo thời gian
                messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                messagesList.innerHTML = messages.map(message => `
                    <div class="message ${message.senderId === userId ? 'message-sent' : 'message-received'} mb-3">
                        <div class="message-content">
                            <div class="message-text">${message.text}</div>
                            <div class="message-time small text-muted">
                                ${moment(message.timestamp).format('HH:mm DD/MM/YYYY')}
                            </div>
                        </div>
                    </div>
                `).join('');

                // Scroll to bottom
                messagesList.scrollTop = messagesList.scrollHeight;

                // Đánh dấu tin nhắn đã đọc
                if (messages.length > 0) {
                    const updates = {};
                    messages.forEach(message => {
                        if (message.senderId !== userId && !message.isRead) {
                            updates[`messages/${jobId}/${candidateId}/${message.id}/isRead`] = true;
                        }
                    });
                    if (Object.keys(updates).length > 0) {
                        update(ref(database), updates);
                    }
                }
            });
        }

        function loadNotifications(userId) {
            // Placeholder cho load thông báo
            document.getElementById('notificationsList').innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-bell fa-3x mb-3"></i>
                    <p>Chức năng đang được phát triển</p>
                </div>
            `;
        }

        function loadReports(userId) {
            // Placeholder cho load báo cáo
            document.getElementById('totalJobPosts').textContent = '0';
            document.getElementById('totalApplications').textContent = '0';
            document.getElementById('totalViews').textContent = '0';
            document.getElementById('hiredCandidates').textContent = '0';
        }

        // Candidate section loaders
        function loadCVList(userId) {
            // Placeholder - sẽ load từ database
            document.getElementById('cvList').innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-file-alt fa-3x mb-3"></i>
                    <p>Bạn chưa có CV nào. Hãy tạo CV đầu tiên!</p>
                    <a href="create-cv.html" class="btn btn-primary">Tạo CV ngay</a>
                </div>
            `;
        }

        function loadAIJobSuggestions(userId) {
            // Simulate loading with timeout
            setTimeout(() => {
                document.getElementById('aiJobsList').innerHTML = `
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle me-2"></i>
                        Đã tìm thấy 12 việc làm phù hợp với profile của bạn!
                    </div>
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-cogs fa-3x mb-3"></i>
                        <p>Chức năng AI đang được phát triển</p>
                        <small>Sắp ra mắt với nhiều tính năng thông minh</small>
                    </div>
                `;
            }, 2000);
        }

        function loadCoverLetters(userId) {
            document.getElementById('coverLetterList').innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-envelope fa-3x mb-3"></i>
                    <p>Chưa có thư xin việc nào</p>
                </div>
            `;
        }

        function loadAppliedJobs(userId) {
            document.getElementById('appliedJobsFullList').innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-briefcase fa-3x mb-3"></i>
                    <p>Bạn chưa ứng tuyển công việc nào</p>
                    <a href="jobs.html" class="btn btn-primary">Tìm việc ngay</a>
                </div>
            `;
        }

        function loadSavedJobs(userId) {
            document.getElementById('savedJobsFullList').innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-heart fa-3x mb-3"></i>
                    <p>Chưa có việc làm nào được lưu</p>
                    <a href="jobs.html" class="btn btn-primary">Khám phá việc làm</a>
                </div>
            `;
        }

        function loadCandidateMessages(userId) {
            const { database, ref, get, query, orderByChild, equalTo, onValue } = window.firebase;
            const conversationsList = document.getElementById('candidateConversationsList');
            const messagesList = document.getElementById('candidateMessagesList');
            const messageInput = document.getElementById('candidateMessageInput');
            const sendMessageBtn = document.getElementById('candidateSendMessageBtn');

            // Lấy danh sách các công việc mà ứng viên đã được duyệt
            const applicationsRef = ref(database, 'applications');
            
            // Tìm tất cả applications của ứng viên này
            get(query(applicationsRef)).then(async (snapshot) => {
                const approvedJobs = [];
                
                if (snapshot.exists()) {
                    // Duyệt qua tất cả jobs
                    snapshot.forEach((jobSnapshot) => {
                        const jobId = jobSnapshot.key;
                        // Duyệt qua tất cả applications trong job
                        jobSnapshot.forEach((appSnapshot) => {
                            const application = appSnapshot.val();
                            // Kiểm tra nếu là application của user hiện tại và đã được duyệt
                            if (application.candidateId === userId && application.status === 'accepted') {
                                approvedJobs.push({
                                    jobId: jobId,
                                    ...application
                                });
                            }
                        });
                    });
                }

                if (approvedJobs.length === 0) {
                    conversationsList.innerHTML = `
                        <div class="text-center text-muted py-4">
                            <i class="fas fa-comments fa-3x mb-3"></i>
                            <p>Chưa có tin nhắn nào</p>
                            <small>Bạn sẽ nhận được tin nhắn khi được duyệt ứng tuyển</small>
                        </div>
                    `;
                    return;
                }

                // Lấy thông tin chi tiết của từng job
                const jobDetails = await Promise.all(approvedJobs.map(async (job) => {
                    const jobRef = ref(database, `jobs/${job.jobId}`);
                    const jobSnapshot = await get(jobRef);
                    const jobData = jobSnapshot.val();
                    
                    // Lấy thông tin nhà tuyển dụng
                    const employerRef = ref(database, `users/${jobData.employerId}`);
                    const employerSnapshot = await get(employerRef);
                    const employerData = employerSnapshot.val();

                    return {
                        ...job,
                        jobTitle: jobData.title,
                        employerName: employerData.name || employerData.email,
                        employerId: jobData.employerId
                    };
                }));

                // Hiển thị danh sách hội thoại
                conversationsList.innerHTML = jobDetails.map(job => `
                    <a href="#" class="list-group-item list-group-item-action conversation-item" 
                       data-job-id="${job.jobId}"
                       data-employer-id="${job.employerId}">
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1">${job.jobTitle}</h6>
                            <small class="text-muted unread-count"></small>
                        </div>
                        <p class="mb-1 small text-truncate">${job.employerName}</p>
                        <small class="text-muted">
                            <i class="fas fa-clock me-1"></i>${moment(job.appliedAt).fromNow()}
                        </small>
                    </a>
                `).join('');

                // Xử lý sự kiện click vào hội thoại
                const conversationItems = document.querySelectorAll('#candidateConversationsList .conversation-item');
                conversationItems.forEach(item => {
                    item.addEventListener('click', function(e) {
                        e.preventDefault();
                        
                        // Remove active class from all items
                        conversationItems.forEach(i => i.classList.remove('active'));
                        // Add active class to clicked item
                        this.classList.add('active');

                        const jobId = this.dataset.jobId;
                        
                        // Load tin nhắn của hội thoại được chọn
                        loadCandidateConversationMessages(userId, jobId);
                    });
                });

                // Xử lý gửi tin nhắn
                if (sendMessageBtn) {
                    sendMessageBtn.onclick = function() {
                        const activeConversation = document.querySelector('#candidateConversationsList .conversation-item.active');
                        if (!activeConversation || !messageInput.value.trim()) return;

                        const jobId = activeConversation.dataset.jobId;
                        const messageText = messageInput.value.trim();

                        // Tạo tin nhắn mới
                        const messagesRef = ref(database, `messages/${jobId}/${userId}`);
                        const newMessageRef = ref(database, `messages/${jobId}/${userId}/${Date.now()}`);
                        set(newMessageRef, {
                            senderId: userId,
                            text: messageText,
                            timestamp: serverTimestamp(),
                            isRead: false
                        }).then(() => {
                            messageInput.value = '';
                            messageInput.focus();
                        }).catch(error => {
                            console.error('Error sending message:', error);
                            Swal.fire({
                                icon: 'error',
                                title: 'Lỗi!',
                                text: 'Không thể gửi tin nhắn.'
                            });
                        });
                    };

                    // Xử lý gửi tin nhắn khi nhấn Enter
                    messageInput.onkeypress = function(e) {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            sendMessageBtn.click();
                        }
                    };
                }
            }).catch(error => {
                console.error('Error loading candidate messages:', error);
                conversationsList.innerHTML = `
                    <div class="alert alert-danger">
                        Có lỗi xảy ra khi tải tin nhắn
                    </div>
                `;
            });
        }

        // Hàm load tin nhắn của một hội thoại cho ứng viên
        function loadCandidateConversationMessages(userId, jobId) {
            const { database, ref, onValue } = window.firebase;
            const messagesList = document.getElementById('candidateMessagesList');
            const messagesRef = ref(database, `messages/${jobId}/${userId}`);

            // Hiển thị loading
            messagesList.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Đang tải...</span>
                    </div>
                </div>
            `;

            onValue(messagesRef, (snapshot) => {
                if (!snapshot.exists()) {
                    messagesList.innerHTML = `
                        <div class="text-center text-muted py-4">
                            <p>Chưa có tin nhắn nào</p>
                            <small>Hãy bắt đầu cuộc trò chuyện</small>
                        </div>
                    `;
                    return;
                }

                const messages = [];
                snapshot.forEach((childSnapshot) => {
                    messages.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });

                // Sắp xếp tin nhắn theo thời gian
                messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                messagesList.innerHTML = messages.map(message => `
                    <div class="message ${message.senderId === userId ? 'message-sent' : 'message-received'} mb-3">
                        <div class="message-content">
                            <div class="message-text">${message.text}</div>
                            <div class="message-time small text-muted">
                                ${moment(message.timestamp).format('HH:mm DD/MM/YYYY')}
                            </div>
                        </div>
                    </div>
                `).join('');

                // Scroll to bottom
                messagesList.scrollTop = messagesList.scrollHeight;

                // Đánh dấu tin nhắn đã đọc
                if (messages.length > 0) {
                    const updates = {};
                    messages.forEach(message => {
                        if (message.senderId !== userId && !message.isRead) {
                            updates[`messages/${jobId}/${userId}/${message.id}/isRead`] = true;
                        }
                    });
                    if (Object.keys(updates).length > 0) {
                        update(ref(database), updates);
                    }
                }
            });
        }

        function loadProfileViews(userId) {
            document.getElementById('profileViewsList').innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-eye fa-3x mb-3"></i>
                    <p>Chưa có nhà tuyển dụng nào xem hồ sơ của bạn</p>
                    <small>Hãy tối ưu CV để thu hút nhà tuyển dụng hơn</small>
                </div>
            `;
        }

        function loadNotificationSettings(userId) {
            // Xử lý form cài đặt thông báo
            const notificationForm = document.getElementById('notificationSettingsForm');
            if (notificationForm) {
                notificationForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    Swal.fire({
                        title: 'Thành công!',
                        text: 'Cài đặt thông báo đã được lưu.',
                        icon: 'success',
                        timer: 1500
                    });
                });
            }
        }

        // Load thông tin tài khoản
        function loadAccountInfo(userId) {
            const userRef = ref(database, `users/${userId}`);
            onValue(userRef, (snapshot) => {
                const userData = snapshot.val();
                if (userData) {
                    // Hiển thị số dư
                    const balanceElement = document.getElementById('accountBalance');
                    if (balanceElement) {
                        balanceElement.textContent = formatMoney(userData.balance || 0);
                    }

                    // Hiển thị số tin đã đăng
                    const totalJobPostsElement = document.getElementById('totalJobPosts');
                    if (totalJobPostsElement) {
                        const jobPostsCount = userData.jobPosts ? Object.keys(userData.jobPosts).length : 0;
                        totalJobPostsElement.textContent = jobPostsCount;
                    }

                    // Hiển thị tổng chi tiêu
                    const totalSpentElement = document.getElementById('totalSpent');
                    if (totalSpentElement) {
                        totalSpentElement.textContent = formatMoney(0); // Đặt mặc định là 0
                    }
                }
            });
        }

        async function displayTransactionHistory(userId) {
            const userRef = ref(database, `users/${userId}`);
            const snapshot = await get(userRef);
            const userData = snapshot.val();
            
            if (!userData || !userData.transactions) {
                const transactionHistory = document.getElementById('transactionHistory');
                if (transactionHistory) {
                    transactionHistory.innerHTML = `
                        <div class="text-center text-muted py-4">
                            <i class="fas fa-history fa-3x mb-3"></i>
                            <p>Chưa có giao dịch nào</p>
                        </div>
                    `;
                }
                return;
            }

            const transactionHistory = document.getElementById('transactionHistory');
            if (!transactionHistory) return;

            // Lấy giá trị của các bộ lọc
            const filterType = document.getElementById('filterTransactionType')?.value;
            const filterStatus = document.getElementById('filterTransactionStatus')?.value;

            // Sắp xếp giao dịch theo thời gian (mới nhất lên đầu) và áp dụng bộ lọc
            const transactions = Object.entries(userData.transactions)
                .filter(([, transaction]) => {
                    // Áp dụng bộ lọc loại giao dịch
                    if (filterType && transaction.type !== filterType) {
                        return false;
                    }
                    // Áp dụng bộ lọc trạng thái
                    if (filterStatus && transaction.status !== filterStatus) {
                        return false;
                    }
                    return true;
                })
                .sort(([, a], [, b]) => {
                    // Chuyển đổi thời gian từ string sang timestamp để so sánh
                    const timeA = moment(a.createdAt, 'YYYYMMDDHHmmss').valueOf();
                    const timeB = moment(b.createdAt, 'YYYYMMDDHHmmss').valueOf();
                    return timeB - timeA;
                });

            if (transactions.length === 0) {
                transactionHistory.innerHTML = `
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-history fa-3x mb-3"></i>
                        <p>Không tìm thấy giao dịch nào phù hợp với bộ lọc</p>
                    </div>
                `;
                return;
            }

            let html = '';
            transactions.forEach(([id, transaction]) => {
                const statusClass = getTransactionStatusClass(transaction.status);
                const typeText = getTransactionTypeText(transaction.type);
                const statusText = getTransactionStatusText(transaction.status);
                const amount = transaction.amount;
                const formattedAmount = formatMoney(amount);
                const date = moment(transaction.createdAt, 'YYYYMMDDHHmmss').format('HH:mm DD/MM/YYYY');

                html += `
                    <div class="transaction-item border-bottom py-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1">${typeText}</h6>
                                <p class="mb-1 text-muted small">${transaction.orderInfo || ''}</p>
                                <p class="mb-0 text-muted small">${date}</p>
                            </div>
                            <div class="text-end">
                                <h6 class="mb-1 ${transaction.type === 'deposit' ? 'text-success' : 'text-danger'}">
                                    ${transaction.type === 'deposit' ? '+' : '-'}${formattedAmount}
                                </h6>
                                <span class="badge ${statusClass}">${statusText}</span>
                            </div>
                        </div>
                    </div>
                `;
            });

            transactionHistory.innerHTML = html;
        }

        // Xử lý form nạp tiền
        const topUpForm = document.getElementById('topUpForm');
        if (topUpForm) {
            topUpForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const user = auth.currentUser;
                if (!user) {
                    Swal.fire('Lỗi!', 'Vui lòng đăng nhập để tiếp tục.', 'error');
                    return;
                }

                // Lấy số tiền
                const customAmount = document.getElementById('customAmount').value;
                const selectedAmount = document.querySelector('input[name="topUpAmount"]:checked')?.value;
                const amount = customAmount ? parseInt(customAmount) : parseInt(selectedAmount);

                if (isNaN(amount) || amount < 150000) {
                    Swal.fire('Lỗi!', 'Số tiền nạp tối thiểu là 150,000 VNĐ', 'error');
                    return;
                }

                if (!document.getElementById('agreePayment').checked) {
                    Swal.fire('Lỗi!', 'Vui lòng đồng ý với điều khoản thanh toán.', 'error');
                    return;
                }

                // Tạo giao dịch
                createVNPayPayment(user.uid, amount);
            });

            // Custom amount input handler
            const customAmountInput = document.getElementById('customAmount');
            if (customAmountInput) {
                customAmountInput.addEventListener('input', function() {
                    const customAmount = this.value;
                    const radioButtons = document.querySelectorAll('input[name="topUpAmount"]');
                    if (customAmount) {
                        radioButtons.forEach(radio => radio.checked = false);
                    }
                });
            }

            // Radio button handler
            document.querySelectorAll('input[name="topUpAmount"]').forEach(radio => {
                radio.addEventListener('change', function() {
                    if (this.checked) {
                        document.getElementById('customAmount').value = '';
                    }
                });
            });
        }

        // Tạo thanh toán VNPAY
        async function createVNPayPayment(userId, amount) {
            // Format số tiền theo yêu cầu của VNPAY (số tiền x 100)
            const amountInVND = Math.round(amount * 100);
            
            // Format thời gian theo yêu cầu của VNPAY (YYYYMMDDHHmmss)
            const createDate = moment().format('YYYYMMDDHHmmss');

            // Lấy địa chỉ IP của người dùng
            let ipAddr = '127.0.0.1';
            try {
                const response = await fetch('https://api.ipify.org?format=json');
                const data = await response.json();
                ipAddr = data.ip;
            } catch (error) {
                console.error('Error fetching IP:', error);
            }

            // Tạo URL thanh toán VNPAY
            const vnpayData = {
                vnp_Version: '2.1.0',
                vnp_Command: 'pay',
                vnp_TmnCode: '2Q01AVYB', // Sử dụng cùng một mã merchant
                vnp_Amount: amountInVND,
                vnp_CurrCode: 'VND',
                vnp_TxnRef: 'TOPUP_' + userId.substring(0, 8) + '_' + Date.now(),
                vnp_OrderInfo: 'Nap tien tai khoan JOBQUEST',
                vnp_OrderType: 'other',
                vnp_Locale: 'vn',
                vnp_ReturnUrl: window.location.origin + '/vnpay_return.html', // Sử dụng cùng một URL callback
                vnp_IpAddr: ipAddr,
                vnp_CreateDate: createDate
            };

            // Debug
            console.log('vnpayData:', vnpayData);

            // Tạo URL VNPAY
            const vnpayUrl = createVNPayUrl(vnpayData);
            
            // Chuyển hướng đến VNPAY
            window.location.href = vnpayUrl;
        }

        // Tạo URL VNPAY
        function createVNPayUrl(data) {
            const baseUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
            const vnp_HashSecret = 'U3I3A1Q4G3Z3MNNJ2NODFKA7G3CBU27P'; // Sử dụng cùng một secret key
            
            // Sắp xếp các tham số theo thứ tự alphabet
            const sortedParams = Object.keys(data)
                .sort()
                .reduce((acc, key) => {
                    acc[key] = data[key];
                    return acc;
                }, {});

            // Tạo chuỗi ký tự cần mã hóa
            const signData = Object.keys(sortedParams)
                .map(key => `${key}=${encodeURIComponent(sortedParams[key]).replace(/%20/g, '+')}`)
                .join('&');

            // Debug
            console.log('signData:', signData);

            // Tạo chữ ký
            const hmac = CryptoJS.HmacSHA512(signData, vnp_HashSecret);
            const hash = hmac.toString(CryptoJS.enc.Hex);

            // Debug
            console.log('hash:', hash);

            // Tạo URL thanh toán
            const queryString = Object.keys(sortedParams)
                .map(key => `${key}=${encodeURIComponent(sortedParams[key]).replace(/%20/g, '+')}`)
                .join('&');

            const finalQueryString = `${queryString}&vnp_SecureHash=${hash}`;
            return `${baseUrl}?${finalQueryString}`;
        }

        // Xử lý callback từ VNPAY
        if (window.location.href.indexOf('vnpay_return.html') > -1) {
            const urlParams = new URLSearchParams(window.location.search);
            const vnp_ResponseCode = urlParams.get('vnp_ResponseCode');
            const vnp_TransactionNo = urlParams.get('vnp_TransactionNo');
            const vnp_TransactionStatus = urlParams.get('vnp_TransactionStatus');
            const vnp_TxnRef = urlParams.get('vnp_TxnRef');
            const vnp_SecureHash = urlParams.get('vnp_SecureHash');

            // Debug
            console.log('vnp_ResponseCode:', vnp_ResponseCode);
            console.log('vnp_TransactionNo:', vnp_TransactionNo);
            console.log('vnp_TransactionStatus:', vnp_TransactionStatus);
            console.log('vnp_TxnRef:', vnp_TxnRef);
            console.log('vnp_SecureHash:', vnp_SecureHash);

            // Lấy tất cả các tham số từ URL (trừ vnp_SecureHash)
            const params = {};
            urlParams.forEach((value, key) => {
                if (key !== 'vnp_SecureHash' && key.startsWith('vnp_')) {
                    params[key] = value;
                }
            });

            // Sắp xếp tham số theo thứ tự alphabet
            const sortedKeys = Object.keys(params).sort();
            
            // Tạo chuỗi query string để hash
            const signData = sortedKeys
                .map(key => `${key}=${params[key]}`)
                .join('&');

            // Tạo chữ ký với secret key
            const vnp_HashSecret = 'U3I3A1Q4G3Z3MNNJ2NODFKA7G3CBU27P';
            const hmac = CryptoJS.HmacSHA512(signData, vnp_HashSecret);
            const calculatedHash = hmac.toString(CryptoJS.enc.Hex);

            console.log('Sign data:', signData);
            console.log('Calculated hash:', calculatedHash);
            console.log('Received hash:', vnp_SecureHash);

            // Xác thực chữ ký
            if (calculatedHash.toLowerCase() === vnp_SecureHash.toLowerCase()) {
                // Chữ ký hợp lệ
                if (vnp_ResponseCode === '00' && vnp_TransactionStatus === '00') {
                    // Thanh toán thành công
                    const amount = parseInt(vnp_Amount) / 100; // Chuyển về số tiền gốc
                    
                    // Cập nhật số dư tài khoản
                    onAuthStateChanged(auth, function(user) {
                        if (user && vnp_TxnRef.startsWith('TOPUP_' + user.uid.substring(0, 8))) {
                            const userRef = ref(database, `users/${user.uid}`);
                            get(userRef).then((snapshot) => {
                                const userData = snapshot.val();
                                const newBalance = (userData.balance || 0) + amount;

                                // Cập nhật số dư
                                set(ref(database, `users/${user.uid}/balance`), newBalance)
                                    .then(() => {
                            Swal.fire({
                                icon: 'success',
                                        title: 'Thanh toán thành công!',
                                        text: `Đã nạp ${amount.toLocaleString('vi-VN')} VNĐ vào tài khoản`,
                                        showConfirmButton: true
                            }).then(() => {
                                            window.location.href = 'member.html';
                                        });
                                    })
                                    .catch((error) => {
                                        console.error('Error updating balance:', error);
                                        Swal.fire({
                                            icon: 'error',
                                            title: 'Lỗi!',
                                            text: 'Không thể cập nhật số dư tài khoản.',
                                            showConfirmButton: true
                                        });
                                    });
                            });
                        }
                    });
                } else {
                    // Thanh toán thất bại
                    Swal.fire({
                        icon: 'error',
                        title: 'Thanh toán thất bại!',
                        text: 'Vui lòng thử lại sau.',
                        showConfirmButton: true
                    }).then(() => {
                        window.location.href = 'member.html';
                    });
                }
            } else {
                // Chữ ký không hợp lệ
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi bảo mật!',
                    text: 'Chữ ký không hợp lệ.',
                    showConfirmButton: true
                }).then(() => {
                    window.location.href = 'member.html';
                });
            }
        }

        // Kiểm tra callback VNPAY khi trang load
        if (window.location.search.includes('vnp_ResponseCode')) {
            handleVNPayCallback();
        }

        // Hàm format số tiền
        function formatMoney(amount) {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(amount);
        }

        // Hàm format thời gian
        function formatDateTime(dateString) {
            if (!dateString) return '';
            const year = dateString.substring(0, 4);
            const month = dateString.substring(4, 6);
            const day = dateString.substring(6, 8);
            const hour = dateString.substring(8, 10);
            const minute = dateString.substring(10, 12);
            return `${hour}:${minute} ${day}/${month}/${year}`;
        }

        // Hàm lấy text trạng thái giao dịch
        function getTransactionStatusText(status) {
            switch (status) {
                case 'completed':
                    return 'Thành công';
                case 'pending':
                    return 'Đang xử lý';
                case 'failed':
                    return 'Thất bại';
                default:
                    return status;
            }
        }

        // Hàm lấy class màu cho trạng thái
        function getTransactionStatusClass(status) {
            switch (status) {
                case 'completed':
                    return 'bg-success';
                case 'pending':
                    return 'bg-warning';
                case 'failed':
                    return 'bg-danger';
                default:
                    return 'bg-secondary';
            }
        }

        // Hàm lấy text loại giao dịch
        function getTransactionTypeText(type) {
            switch (type) {
                case 'deposit':
                    return 'Nạp tiền vào tài khoản';
                case 'payment':
                    return 'Chi tiêu';
                default:
                    return type;
            }
        }

        // Cập nhật UI khi người dùng đăng nhập
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // Cập nhật số dư
                updateBalance(user.uid);
                
                // Hiển thị lịch sử giao dịch
                displayTransactionHistory(user.uid);
                
                // Thêm event listeners cho bộ lọc
                const filterType = document.getElementById('filterTransactionType');
                const filterStatus = document.getElementById('filterTransactionStatus');
                
                if (filterType) {
                    filterType.addEventListener('change', () => displayTransactionHistory(user.uid));
                }
                
                if (filterStatus) {
                    filterStatus.addEventListener('change', () => displayTransactionHistory(user.uid));
                }
            }
        });

        // Hàm cập nhật thống kê cho nhà tuyển dụng
        async function updateEmployerStatistics(userId) {
            const { database, ref, get, query, orderByChild, equalTo } = window.firebase;
            const statisticsCards = document.getElementById('statisticsCards');
            const latestJobsList = document.getElementById('jobPostsList');
            const latestApplicationsList = document.getElementById('applicationsList');
            
            try {
                // Lấy danh sách tin tuyển dụng của nhà tuyển dụng
                const jobsRef = ref(database, 'jobs');
                const jobsQuery = query(jobsRef, orderByChild('employerId'), equalTo(userId));
                const jobsSnapshot = await get(jobsQuery);

                // Khởi tạo các biến thống kê
                let totalJobs = 0;
                let activeJobs = 0;
                let totalApplications = 0;
                let pendingApplications = 0;
                let acceptedApplications = 0;
                let jobs = [];

                if (jobsSnapshot.exists()) {
                    // Đếm số tin tuyển dụng
                    jobsSnapshot.forEach((jobSnapshot) => {
                        const job = jobSnapshot.val();
                        job.id = jobSnapshot.key;
                        jobs.push(job);
                        totalJobs++;
                        if (job.status === 'approved') {
                            activeJobs++;
                        }
                    });

                    // Lấy số lượng ứng viên cho mỗi tin
                    for (const job of jobs) {
                        const applicationsRef = ref(database, `applications/${job.id}`);
                        const applicationsSnapshot = await get(applicationsRef);
                        
                        if (applicationsSnapshot.exists()) {
                            applicationsSnapshot.forEach((applicationSnapshot) => {
                                const application = applicationSnapshot.val();
                                totalApplications++;
                                if (application.status === 'pending') {
                                    pendingApplications++;
                                } else if (application.status === 'accepted') {
                                    acceptedApplications++;
                                }
                            });
                        }
                    }
                }

                // Cập nhật giao diện thống kê
                if (statisticsCards) {
                    statisticsCards.innerHTML = `
                        <div class="col-md-6">
                            <div class="card border-0 shadow-sm h-100">
                                <div class="card-body text-center">
                                    <div class="feature-icon bg-primary bg-gradient text-white rounded-3 mb-3">
                                        <i class="fas fa-briefcase"></i>
                                    </div>
                                    <h3 class="fw-bold">${totalJobs}</h3>
                                    <p class="text-muted mb-0">Tin tuyển dụng</p>
                                    <hr>
                                    <div class="small text-muted">
                                        <span class="text-success">${activeJobs} đang hiển thị</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6">
                            <div class="card border-0 shadow-sm h-100">
                                <div class="card-body text-center">
                                    <div class="feature-icon bg-success bg-gradient text-white rounded-3 mb-3">
                                        <i class="fas fa-users"></i>
                                    </div>
                                    <h3 class="fw-bold">${totalApplications}</h3>
                                    <p class="text-muted mb-0">Ứng viên</p>
                                    <hr>
                                    <div class="small text-muted">
                                        <span class="text-warning">${pendingApplications} chờ duyệt</span> •
                                        <span class="text-success">${acceptedApplications} đã duyệt</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // Cập nhật danh sách tin tuyển dụng mới nhất
                if (latestJobsList) {
                    if (jobs.length > 0) {
                        // Sắp xếp theo thời gian tạo mới nhất
                        jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                        
                        latestJobsList.innerHTML = `
                            <div class="list-group list-group-flush">
                                ${jobs.slice(0, 5).map(job => `
                                    <div class="list-group-item">
                                        <div class="d-flex w-100 justify-content-between align-items-center">
                                            <div>
                                                <h6 class="mb-1">${job.title}</h6>
                                                <small class="text-muted">
                                                    <i class="fas fa-map-marker-alt me-1"></i>${job.contactAddress}
                                                </small>
                                            </div>
                                            <div class="text-end">
                                                <span class="badge ${job.status === 'approved' ? 'bg-success' : 'bg-warning'}">
                                                    ${job.status === 'approved' ? 'Đang hiển thị' : 'Chờ duyệt'}
                                                </span>
                                                <button class="btn btn-sm btn-outline-primary ms-2" onclick="viewJobDetails('${job.id}')">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `;
                    } else {
                        latestJobsList.innerHTML = `
                            <div class="text-center text-muted py-4">
                                <i class="fas fa-briefcase fa-3x mb-3"></i>
                                <p>Bạn chưa đăng tin tuyển dụng nào</p>
                                <button class="btn btn-primary" onclick="showSection('jobPostForm')">
                                    <i class="fas fa-plus me-2"></i>Đăng tin ngay
                                </button>
                            </div>
                        `;
                    }
                }

                // Cập nhật danh sách ứng viên mới nhất
                if (latestApplicationsList) {
                    let allApplications = [];
                    
                    // Gom tất cả ứng viên từ các tin tuyển dụng
                    for (const job of jobs) {
                        const applicationsRef = ref(database, `applications/${job.id}`);
                        const applicationsSnapshot = await get(applicationsRef);
                        
                        if (applicationsSnapshot.exists()) {
                            applicationsSnapshot.forEach((applicationSnapshot) => {
                                const application = applicationSnapshot.val();
                                application.id = applicationSnapshot.key;
                                application.jobTitle = job.title;
                                allApplications.push(application);
                            });
                        }
                    }

                    if (allApplications.length > 0) {
                        // Sắp xếp theo thời gian ứng tuyển mới nhất
                        allApplications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
                        
                        latestApplicationsList.innerHTML = `
                            <div class="list-group list-group-flush">
                                ${allApplications.slice(0, 5).map(application => `
                                    <div class="list-group-item">
                                        <div class="d-flex w-100 justify-content-between align-items-center">
                                            <div>
                                                <h6 class="mb-1">${application.candidateName}</h6>
                                                <small class="text-muted">
                                                    <i class="fas fa-briefcase me-1"></i>${application.jobTitle}
                                                </small>
                                            </div>
                                            <div class="text-end">
                                                <span class="badge ${getStatusBadgeClass(application.status)}">
                                                    ${getStatusText(application.status)}
                                                </span>
                                                <button class="btn btn-sm btn-outline-primary ms-2" onclick="viewApplication('${application.jobId}', '${application.candidateId}')">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `;
                    } else {
                        latestApplicationsList.innerHTML = `
                            <div class="text-center text-muted py-4">
                                <i class="fas fa-users fa-3x mb-3"></i>
                                <p>Chưa có ứng viên nào ứng tuyển</p>
                            </div>
                        `;
                    }
                }
            } catch (error) {
                console.error('Error updating employer statistics:', error);
                // Hiển thị thông báo lỗi
                if (statisticsCards) {
                    statisticsCards.innerHTML = `
                        <div class="col-12">
                            <div class="alert alert-danger">
                                <i class="fas fa-exclamation-circle me-2"></i>
                                Có lỗi xảy ra khi tải dữ liệu thống kê
                            </div>
                        </div>
                    `;
                }
                if (latestJobsList) {
                    latestJobsList.innerHTML = `
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-circle me-2"></i>
                            Có lỗi xảy ra khi tải danh sách tin tuyển dụng
                        </div>
                    `;
                }
                if (latestApplicationsList) {
                    latestApplicationsList.innerHTML = `
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-circle me-2"></i>
                            Có lỗi xảy ra khi tải danh sách ứng viên
                        </div>
                    `;
                }
            }
        }

        // Thêm hàm xem chi tiết và chỉnh sửa tin
        function viewJobDetails(jobId) {
            // TODO: Implement view job details
            console.log('View job:', jobId);
        }

        function editJob(jobId) {
            // TODO: Implement edit job
            console.log('Edit job:', jobId);
        }

        // Cập nhật phần xử lý trạng thái đăng nhập
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Lấy thông tin user từ database
                const userRef = ref(database, 'users/' + user.uid);
                const snapshot = await get(userRef);
                const userData = snapshot.val();

                if (userData && userData.role === 'employer') {
                    // Cập nhật thống kê cho nhà tuyển dụng
                    updateEmployerStatistics(user.uid);
                }
            }
        });

        // Hàm xem chi tiết tin tuyển dụng
        window.viewJobDetails = function(jobId) {
            const { database, ref, get } = window.firebase;
            const jobRef = ref(database, `jobs/${jobId}`);
            
            get(jobRef).then((snapshot) => {
                if (!snapshot.exists()) {
                    Swal.fire({
                        title: 'Lỗi!',
                        text: 'Không tìm thấy thông tin tin tuyển dụng',
                        icon: 'error'
                    });
                    return;
                }

                const job = snapshot.val();
                
                Swal.fire({
                    title: job.title,
                    html: `
                        <div class="text-start">
                            <h6>Chi tiết công việc:</h6>
                            <p><strong>Loại hình:</strong> ${job.type}</p>
                            <p><strong>Địa điểm:</strong> ${job.location}</p>
                            <p><strong>Mức lương:</strong> ${job.salaryMin} - ${job.salaryMax} VNĐ</p>
                            
                            <h6 class="mt-4">Mô tả công việc:</h6>
                            <div class="border rounded p-3 bg-light">
                                <pre style="white-space: pre-wrap;">${job.description}</pre>
                            </div>
                            
                            <h6 class="mt-4">Yêu cầu:</h6>
                            <div class="border rounded p-3 bg-light">
                                <pre style="white-space: pre-wrap;">${job.requirements}</pre>
                            </div>
                            
                            <h6 class="mt-4">Thông tin khác:</h6>
                            <p><strong>Ngày đăng:</strong> ${new Date(job.createdAt).toLocaleString('vi-VN')}</p>
                            <p><strong>Trạng thái:</strong> <span class="badge ${getStatusBadgeClass(job.status)}">${getStatusText(job.status)}</span></p>
                        </div>
                    `,
                    width: '600px',
                    confirmButtonText: 'Đóng'
                });
            });
        }
    }); // Đóng module script

    // Hàm cập nhật số dư tài khoản
    function updateBalance(userId) {
        const balanceElement = document.getElementById('accountBalance');
        if (!balanceElement) return;

        const userRef = ref(database, `users/${userId}`);
        onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            if (userData && userData.balance !== undefined) {
                balanceElement.textContent = formatMoney(userData.balance);
            }
        });
    }

    // Hàm format số tiền
    function formatMoney(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    // Hàm format thời gian
    function formatDateTime(dateString) {
        if (!dateString) return '';
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);
        const hour = dateString.substring(8, 10);
        const minute = dateString.substring(10, 12);
        return `${hour}:${minute} ${day}/${month}/${year}`;
    }

    // Hàm lấy text trạng thái giao dịch
    function getTransactionStatusText(status) {
        switch (status) {
            case 'completed':
                return 'Thành công';
            case 'pending':
                return 'Đang xử lý';
            case 'failed':
                return 'Thất bại';
            default:
                return status;
        }
    }

    // Hàm lấy class màu cho trạng thái
    function getTransactionStatusClass(status) {
        switch (status) {
            case 'completed':
                return 'bg-success';
            case 'pending':
                return 'bg-warning';
            case 'failed':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    }

    // Hàm lấy text loại giao dịch
    function getTransactionTypeText(type) {
        switch (type) {
            case 'deposit':
                return 'Nạp tiền vào tài khoản';
            case 'payment':
                return 'Chi tiêu';
            default:
                return type;
        }
    }

    // Hàm hiển thị lịch sử giao dịch
    async function displayTransactionHistory(userId) {
        const userRef = ref(database, `users/${userId}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        if (!userData || !userData.transactions) {
            const transactionHistory = document.getElementById('transactionHistory');
            if (transactionHistory) {
                transactionHistory.innerHTML = `
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-history fa-3x mb-3"></i>
                        <p>Chưa có giao dịch nào</p>
                    </div>
                `;
            }
            return;
        }

        const transactionHistory = document.getElementById('transactionHistory');
        if (!transactionHistory) return;

        // Lấy giá trị của các bộ lọc
        const filterType = document.getElementById('filterTransactionType')?.value;
        const filterStatus = document.getElementById('filterTransactionStatus')?.value;

        // Sắp xếp giao dịch theo thời gian (mới nhất lên đầu) và áp dụng bộ lọc
        const transactions = Object.entries(userData.transactions)
            .filter(([, transaction]) => {
                // Áp dụng bộ lọc loại giao dịch
                if (filterType && transaction.type !== filterType) {
                    return false;
                }
                // Áp dụng bộ lọc trạng thái
                if (filterStatus && transaction.status !== filterStatus) {
                    return false;
                }
                return true;
            })
            .sort(([, a], [, b]) => {
                // Chuyển đổi thời gian từ string sang timestamp để so sánh
                const timeA = moment(a.createdAt, 'YYYYMMDDHHmmss').valueOf();
                const timeB = moment(b.createdAt, 'YYYYMMDDHHmmss').valueOf();
                return timeB - timeA;
            });

        if (transactions.length === 0) {
            transactionHistory.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-history fa-3x mb-3"></i>
                    <p>Không tìm thấy giao dịch nào phù hợp với bộ lọc</p>
                </div>
            `;
            return;
        }

        let html = '';
        transactions.forEach(([id, transaction]) => {
            const statusClass = getTransactionStatusClass(transaction.status);
            const typeText = getTransactionTypeText(transaction.type);
            const statusText = getTransactionStatusText(transaction.status);
            const amount = transaction.amount;
            const formattedAmount = formatMoney(amount);
            const date = moment(transaction.createdAt, 'YYYYMMDDHHmmss').format('HH:mm DD/MM/YYYY');

            html += `
                <div class="transaction-item border-bottom py-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${typeText}</h6>
                            <p class="mb-1 text-muted small">${transaction.orderInfo || ''}</p>
                            <p class="mb-0 text-muted small">${date}</p>
                        </div>
                        <div class="text-end">
                            <h6 class="mb-1 ${transaction.type === 'deposit' ? 'text-success' : 'text-danger'}">
                                ${transaction.type === 'deposit' ? '+' : '-'}${formattedAmount}
                            </h6>
                            <span class="badge ${statusClass}">${statusText}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        transactionHistory.innerHTML = html;
    }

    // Cập nhật UI khi người dùng đăng nhập
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Cập nhật số dư
            updateBalance(user.uid);
            
            // Hiển thị lịch sử giao dịch
            displayTransactionHistory(user.uid);
            
            // Thêm event listeners cho bộ lọc
            const filterType = document.getElementById('filterTransactionType');
            const filterStatus = document.getElementById('filterTransactionStatus');
            
            if (filterType) {
                filterType.addEventListener('change', () => displayTransactionHistory(user.uid));
            }
            
            if (filterStatus) {
                filterStatus.addEventListener('change', () => displayTransactionHistory(user.uid));
            }
        }
    });
