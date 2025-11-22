import 'package:flutter/material.dart';

class SwitchAccountSplash extends StatefulWidget {
  final String message;
  final VoidCallback onComplete;

  const SwitchAccountSplash({
    super.key,
    required this.message,
    required this.onComplete,
  });

  @override
  State<SwitchAccountSplash> createState() => _SwitchAccountSplashState();
}

class _SwitchAccountSplashState extends State<SwitchAccountSplash>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeIn,
    ));

    _startAnimation();
  }

  void _startAnimation() async {
    await _animationController.forward();
    
    // Wait a bit before calling onComplete
    await Future.delayed(const Duration(milliseconds: 700));
    
    if (mounted) {
      widget.onComplete();
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // NUSA Logo - larger for full screen
                Container(
                  width: 120,
                  height: 120,
                  child: Image.asset(
                    'assets/images/logonusa.png',
                    fit: BoxFit.contain,
                  ),
                ),
                const SizedBox(height: 40),
                
                // Message - smaller text
                Text(
                  widget.message,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1E293B),
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 40),
                
                // Loading indicator
                const SizedBox(
                  width: 40,
                  height: 40,
                  child: CircularProgressIndicator(
                    strokeWidth: 4,
                    valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2563EB)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
