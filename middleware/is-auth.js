//Nếu chưa Login thì trở về trang đăng nhập
module.exports = (req, res, next) => {
    console.log('isAuth Middleware - Session:', req.session);
    console.log('isAuth Middleware - User:', req.user);
    
    if (!req.session || !req.session.isLoggedIn) {
        console.error('Unauthorized: Not logged in');
        return res.status(401).json({ 
            success: false, 
            error: 'Bạn cần đăng nhập để thực hiện thao tác này' 
        });
    }
    next();
};