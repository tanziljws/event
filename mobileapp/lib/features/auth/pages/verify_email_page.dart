import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../bloc/auth_bloc.dart';
import '../../../shared/widgets/loading_overlay.dart';
import '../../../shared/widgets/otp_input_field.dart';
import '../../../core/constants/app_constants.dart';

class VerifyEmailPage extends StatefulWidget {
  final String email;

  const VerifyEmailPage({
    super.key,
    required this.email,
  });

  @override
  State<VerifyEmailPage> createState() => _VerifyEmailPageState();
}

class _VerifyEmailPageState extends State<VerifyEmailPage> with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  String _otpValue = '';
  int _resendCountdown = 0;
  bool _canResend = true;
  bool _hasError = false;
  late AnimationController _shakeController;
  late Animation<double> _shakeAnimation;

  @override
  void initState() {
    super.initState();
    _startResendCountdown();
    
    // Initialize shake animation
    _shakeController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
    _shakeAnimation = Tween<double>(
      begin: 0,
      end: 10,
    ).animate(CurvedAnimation(
      parent: _shakeController,
      curve: Curves.elasticIn,
    ));
  }

  @override
  void dispose() {
    _shakeController.dispose();
    super.dispose();
  }

  void _startResendCountdown() {
    setState(() {
      _resendCountdown = 60;
      _canResend = false;
    });

    _runCountdown();
  }

  void _runCountdown() {
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted && _resendCountdown > 0) {
        setState(() {
          _resendCountdown--;
        });
        _runCountdown();
      } else if (mounted) {
        setState(() {
          _canResend = true;
        });
      }
    });
  }

  void _handleVerifyEmail() {
    if (_formKey.currentState?.validate() ?? false) {
      context.read<AuthBloc>().add(
        AuthVerifyEmailRequested(
          email: widget.email,
          otpCode: _otpValue.trim(),
        ),
      );
    }
  }

  void _verifyOtp() {
    // Auto-verify when all 6 digits are filled
    if (_otpValue.length == 6) {
      context.read<AuthBloc>().add(
        AuthVerifyEmailRequested(
          email: widget.email,
          otpCode: _otpValue.trim(),
        ),
      );
    }
  }

  void _onOtpChanged(String value) {
    setState(() {
      _otpValue = value;
    });
  }

  void _handleResendOtp() {
    if (_canResend) {
      context.read<AuthBloc>().add(
        AuthResendOtpRequested(email: widget.email),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      appBar: AppBar(
        backgroundColor: AppConstants.backgroundColor,
        foregroundColor: Colors.black,
        elevation: 0,
        leading: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.arrow_back, size: 20),
          ),
          onPressed: () => context.go('/register'),
        ),
        title: const Text(
          'Verify Email',
          style: TextStyle(
            color: Colors.black,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is AuthSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Theme.of(context).colorScheme.primary,
              ),
            );
            
            // Check if this is a resend OTP success
            if (state.message.toLowerCase().contains('otp') && 
                state.message.toLowerCase().contains('sent')) {
              _startResendCountdown();
            } else {
              // This is email verification success, go to login
              context.go('/login');
            }
          } else if (state is AuthFailure) {
            // Show error feedback
            setState(() {
              _hasError = true;
            });
            
            // Trigger shake animation
            _shakeController.forward().then((_) {
              _shakeController.reverse();
            });
            
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Theme.of(context).colorScheme.error,
              ),
            );
            
            // Reset error state after 2 seconds
            Future.delayed(const Duration(seconds: 2), () {
              if (mounted) {
                setState(() {
                  _hasError = false;
                });
              }
            });
          }
        },
        child: BlocBuilder<AuthBloc, AuthState>(
          builder: (context, state) {
            return LoadingOverlay(
              isLoading: state is AuthLoading,
              child: SafeArea(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24.0),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const SizedBox(height: 40),
                        
                        // Title
                        Text(
                          'Verify Your Email',
                          style: const TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: Colors.black,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        
                        const SizedBox(height: 16),
                        
                        // Description
                        Text(
                          'We\'ve sent a verification code to',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[600],
                          ),
                          textAlign: TextAlign.center,
                        ),
                        
                        const SizedBox(height: 8),
                        
                        Text(
                          widget.email,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppConstants.primaryColor,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        
                        const SizedBox(height: 40),
                        
                        // OTP Input Fields with Error Feedback
                        AnimatedBuilder(
                          animation: _shakeAnimation,
                          builder: (context, child) {
                            return Transform.translate(
                              offset: Offset(_shakeAnimation.value * (_hasError ? 1 : 0), 0),
                              child: OtpInputField(
                                length: 6,
                                onChanged: _onOtpChanged,
                                onComplete: _verifyOtp,
                                validator: (value) {
                                  if (value == null || value.isEmpty) {
                                    return 'Please enter verification code';
                                  }
                                  if (value.length != 6) {
                                    return 'Please enter 6-digit code';
                                  }
                                  if (!RegExp(r'^\d{6}$').hasMatch(value)) {
                                    return 'Please enter valid 6-digit code';
                                  }
                                  return null;
                                },
                                fillColor: Colors.grey[50],
                                borderColor: _hasError ? Colors.red : Colors.grey[300]!,
                                textColor: Colors.black,
                                fontSize: 24,
                                width: 50,
                                height: 60,
                              ),
                            );
                          },
                        ),
                        
                        const SizedBox(height: 40),
                        
                        // Verify Button
                        Container(
                          height: 56,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppConstants.primaryColor,
                                AppConstants.primaryColor.withOpacity(0.8),
                              ],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: AppConstants.primaryColor.withOpacity(0.3),
                                blurRadius: 15,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          child: ElevatedButton(
                            onPressed: _handleVerifyEmail,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.transparent,
                              shadowColor: Colors.transparent,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            child: state is AuthLoading
                                ? const SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Text(
                                    'Verify Email',
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                          ),
                        ),
                        
                        const SizedBox(height: 32),
                        
                        // Resend OTP Section
                        Column(
                          children: [
                            Text(
                              'Didn\'t receive the code?',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey[600],
                              ),
                            ),
                            const SizedBox(height: 8),
                            if (_canResend)
                              TextButton(
                                onPressed: _handleResendOtp,
                                style: TextButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                ),
                                child: Text(
                                  'Resend Code',
                                  style: TextStyle(
                                    color: AppConstants.primaryColor,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              )
                            else
                              Text(
                                'Resend in ${_resendCountdown}s',
                                style: TextStyle(
                                  color: Colors.grey[500],
                                  fontSize: 14,
                                ),
                              ),
                          ],
                        ),
                        
                        const SizedBox(height: 32),
                        
                        // Back to Login
                        TextButton(
                          onPressed: () => context.go('/login'),
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                          child: Text(
                            'Back to Login',
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 16,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

