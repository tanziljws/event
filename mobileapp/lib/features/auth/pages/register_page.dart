import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../bloc/auth_bloc.dart';
import '../../../shared/widgets/simple_text_field.dart';
import '../../../shared/widgets/loading_overlay.dart';
import '../../../shared/widgets/password_strength_indicator.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _educationController = TextEditingController();
  
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  String _selectedRole = 'PARTICIPANT';
  String _selectedOrganizerType = 'INDIVIDUAL';
  
  // Organizer specific fields
  final _businessNameController = TextEditingController();
  final _communityNameController = TextEditingController();
  final _institutionNameController = TextEditingController();
  final _contactPersonController = TextEditingController();
  final _websiteController = TextEditingController();

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _educationController.dispose();
    _businessNameController.dispose();
    _communityNameController.dispose();
    _institutionNameController.dispose();
    _contactPersonController.dispose();
    _websiteController.dispose();
    super.dispose();
  }

  /// Build modern text field like upgrade page
  Widget _buildModernTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    TextInputType? keyboardType,
    int maxLines = 1,
    bool obscureText = false,
    Widget? suffixIcon,
    String? Function(String?)? validator,
    void Function(String)? onChanged,
    bool isSuccess = false,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      obscureText: obscureText,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        labelStyle: TextStyle(color: isSuccess ? Colors.green : Colors.grey[700]),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: BorderSide(color: isSuccess ? Colors.green : Colors.grey[300]!),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: BorderSide(color: isSuccess ? Colors.green : Colors.grey[300]!),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: BorderSide(color: isSuccess ? Colors.green : Colors.grey[700]!, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: const BorderSide(color: Colors.red),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: const BorderSide(color: Colors.red, width: 2),
        ),
        filled: true,
        fillColor: isSuccess ? Colors.green.withOpacity(0.05) : Colors.grey[50],
        prefixIcon: null,
        suffixIcon: suffixIcon,
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      ),
      validator: validator,
      onChanged: onChanged,
    );
  }

  void _handleRegister() {
    if (_formKey.currentState?.validate() ?? false) {
      if (_selectedRole == 'PARTICIPANT') {
        context.read<AuthBloc>().add(
          AuthRegisterParticipantRequested(
            fullName: _fullNameController.text.trim(),
            email: _emailController.text.trim(),
            password: _passwordController.text,
            phoneNumber: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
            address: _addressController.text.trim().isEmpty ? null : _addressController.text.trim(),
            lastEducation: _educationController.text.trim().isEmpty ? null : _educationController.text.trim(),
          ),
        );
      } else {
        // Organizer registration
        Map<String, dynamic> profileData = {};
        
        switch (_selectedOrganizerType) {
          case 'INDIVIDUAL':
            profileData = {
              'nik': '', // Will be filled in profile setup
              'personalAddress': _addressController.text.trim(),
              'personalPhone': _phoneController.text.trim(),
              'portfolio': [],
              'socialMedia': {},
            };
            break;
          case 'COMMUNITY':
            profileData = {
              'communityName': _communityNameController.text.trim(),
              'communityType': '',
              'communityAddress': _addressController.text.trim(),
              'communityPhone': _phoneController.text.trim(),
              'contactPerson': _contactPersonController.text.trim(),
              'website': _websiteController.text.trim(),
              'socialMedia': {},
            };
            break;
          case 'SMALL_BUSINESS':
            profileData = {
              'businessName': _businessNameController.text.trim(),
              'businessType': '',
              'businessAddress': _addressController.text.trim(),
              'businessPhone': _phoneController.text.trim(),
              'npwp': '',
              'logo': '',
              'socialMedia': {},
              'portfolio': [],
            };
            break;
          case 'INSTITUTION':
            profileData = {
              'institutionName': _institutionNameController.text.trim(),
              'institutionType': '',
              'institutionAddress': _addressController.text.trim(),
              'institutionPhone': _phoneController.text.trim(),
              'contactPerson': _contactPersonController.text.trim(),
              'website': _websiteController.text.trim(),
              'socialMedia': {},
            };
            break;
        }
        
        context.read<AuthBloc>().add(
          AuthRegisterOrganizerRequested(
            fullName: _fullNameController.text.trim(),
            email: _emailController.text.trim(),
            password: _passwordController.text,
            organizerType: _selectedOrganizerType,
            profileData: profileData,
            phoneNumber: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
            address: _addressController.text.trim().isEmpty ? null : _addressController.text.trim(),
            lastEducation: _educationController.text.trim().isEmpty ? null : _educationController.text.trim(),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is AuthEmailVerificationRequired) {
            context.go('/verify-email?email=${state.email}');
          } else if (state is AuthFailure) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        child: BlocBuilder<AuthBloc, AuthState>(
          builder: (context, state) {
            return LoadingOverlay(
              isLoading: state is AuthLoading,
              child: Column(
                children: [
                  // Custom Header with Back Button
                  Container(
                    padding: EdgeInsets.only(
                      top: MediaQuery.of(context).padding.top + 20,
                      left: 20,
                      right: 20,
                      bottom: 20,
                    ),
                    child: Row(
                      children: [
                        // Back Button
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: IconButton(
                            onPressed: () => context.go('/login'),
                            icon: const Icon(Icons.arrow_back_ios_new),
                            iconSize: 18,
                            color: Colors.black87,
                          ),
                        ),
                        
                        const SizedBox(width: 20),
                        
                        // Title
                        const Expanded(
                          child: Text(
                            'Create Account',
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: Colors.black,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Content
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(horizontal: 24.0),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Title Section
                            Column(
                              children: [
                                // Title
                                const Text(
                                  'Join Nusa',
                                  style: TextStyle(
                                    fontSize: 28,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                                
                                const SizedBox(height: 8),
                                
                                // Subtitle
                                Text(
                                  'Create your account to get started',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Colors.grey[600],
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                            
                            const SizedBox(height: 32),
                      
                            // Role Selection - Simple
                            Row(
                              children: [
                                Expanded(
                                  child: GestureDetector(
                                    onTap: () {
                                      setState(() {
                                        _selectedRole = 'PARTICIPANT';
                                      });
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                                      decoration: BoxDecoration(
                                        color: _selectedRole == 'PARTICIPANT' 
                                            ? Colors.grey[100] 
                                            : Colors.white,
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(
                                          color: _selectedRole == 'PARTICIPANT' 
                                              ? Colors.black87 
                                              : Colors.grey[300]!,
                                          width: _selectedRole == 'PARTICIPANT' ? 2 : 1,
                                        ),
                                      ),
                                      child: Text(
                                        'Participant',
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w500,
                                          color: _selectedRole == 'PARTICIPANT' 
                                              ? Colors.black87 
                                              : Colors.grey[700],
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                    ),
                                  ),
                                ),
                                
                                const SizedBox(width: 12),
                                
                                Expanded(
                                  child: GestureDetector(
                                    onTap: () {
                                      setState(() {
                                        _selectedRole = 'ORGANIZER';
                                      });
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                                      decoration: BoxDecoration(
                                        color: _selectedRole == 'ORGANIZER' 
                                            ? Colors.grey[100] 
                                            : Colors.white,
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(
                                          color: _selectedRole == 'ORGANIZER' 
                                              ? Colors.black87 
                                              : Colors.grey[300]!,
                                          width: _selectedRole == 'ORGANIZER' ? 2 : 1,
                                        ),
                                      ),
                                      child: Text(
                                        'Organizer',
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w500,
                                          color: _selectedRole == 'ORGANIZER' 
                                              ? Colors.black87 
                                              : Colors.grey[700],
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                      
                            const SizedBox(height: 16),
                            
                            // Organizer Type Selection (if organizer)
                            if (_selectedRole == 'ORGANIZER') ...[
                              Container(
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: Colors.grey[200]!),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.02),
                                      blurRadius: 10,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Organizer Type',
                                      style: TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.black,
                                      ),
                                    ),
                                    
                                    const SizedBox(height: 16),
                                    
                                    DropdownButtonFormField<String>(
                                      initialValue: _selectedOrganizerType,
                                      style: const TextStyle(color: Colors.black),
                                      decoration: InputDecoration(
                                        hintText: 'Select organizer type',
                                        hintStyle: TextStyle(color: Colors.grey[500]),
                                        filled: true,
                                        fillColor: Colors.grey[50],
                                        border: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(12),
                                          borderSide: BorderSide(color: Colors.grey[300]!),
                                        ),
                                        enabledBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(12),
                                          borderSide: BorderSide(color: Colors.grey[300]!),
                                        ),
                                        focusedBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(12),
                                          borderSide: const BorderSide(color: Colors.black87, width: 2),
                                        ),
                                        contentPadding: const EdgeInsets.symmetric(
                                          horizontal: 16,
                                          vertical: 16,
                                        ),
                                      ),
                                      items: const [
                                        DropdownMenuItem(
                                          value: 'INDIVIDUAL',
                                          child: Text('Individual'),
                                        ),
                                        DropdownMenuItem(
                                          value: 'COMMUNITY',
                                          child: Text('Community'),
                                        ),
                                        DropdownMenuItem(
                                          value: 'SMALL_BUSINESS',
                                          child: Text('Small Business'),
                                        ),
                                        DropdownMenuItem(
                                          value: 'INSTITUTION',
                                          child: Text('Institution'),
                                        ),
                                      ],
                                      onChanged: (value) {
                                        setState(() {
                                          _selectedOrganizerType = value!;
                                        });
                                      },
                                    ),
                                  ],
                                ),
                              ),
                              
                              const SizedBox(height: 16),
                            ],
                      
                            // Basic Information
                            Container(
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: Colors.grey[100]!, width: 1),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.08),
                                    blurRadius: 20,
                                    offset: const Offset(0, 8),
                                  ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: Colors.grey[100],
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Icon(
                                          Icons.person_outline,
                                          color: Colors.grey[700],
                                          size: 20,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      const Text(
                                        'Basic Information',
                                        style: TextStyle(
                                          fontSize: 20,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.black87,
                                        ),
                                      ),
                                    ],
                                  ),
                                  
                                  const SizedBox(height: 24),
                                  
                                  _buildModernTextField(
                                    controller: _fullNameController,
                                    label: 'Full Name',
                                    hint: 'Enter your full name',
                                    validator: (value) {
                                      if (value == null || value.isEmpty) {
                                        return 'Please enter your full name';
                                      }
                                      if (value.length < 2) {
                                        return 'Name must be at least 2 characters';
                                      }
                                      return null;
                                    },
                                  ),
                                  
                                  const SizedBox(height: 20),
                                  
                                  _buildModernTextField(
                                    controller: _emailController,
                                    label: 'Email',
                                    hint: 'Enter your email',
                                    keyboardType: TextInputType.emailAddress,
                                    validator: (value) {
                                      if (value == null || value.isEmpty) {
                                        return 'Please enter your email';
                                      }
                                      if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                                        return 'Please enter a valid email';
                                      }
                                      return null;
                                    },
                                  ),
                                  
                                  const SizedBox(height: 20),
                                  
                                  _buildModernTextField(
                                    controller: _passwordController,
                                    label: 'Password',
                                    hint: 'Enter your password',
                                    obscureText: _obscurePassword,
                                    suffixIcon: IconButton(
                                      icon: Icon(
                                        _obscurePassword ? Icons.visibility : Icons.visibility_off,
                                        color: Colors.grey[600],
                                      ),
                                      onPressed: () {
                                        setState(() {
                                          _obscurePassword = !_obscurePassword;
                                        });
                                      },
                                    ),
                                    validator: (value) {
                                      if (value == null || value.isEmpty) {
                                        return 'Please enter your password';
                                      }
                                      if (value.length < 8) {
                                        return 'Password must be at least 8 characters';
                                      }
                                      if (!RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)').hasMatch(value)) {
                                        return 'Password must contain at least one lowercase letter, one uppercase letter, and one number';
                                      }
                                      return null;
                                    },
                                    onChanged: (value) {
                                      setState(() {
                                        // Trigger rebuild to update strength indicator AND confirm password validation
                                      });
                                    },
                                  ),
                                  
                                  const SizedBox(height: 12),
                                  
                                  // Password Strength Indicator
                                  PasswordStrengthIndicator(
                                    password: _passwordController.text,
                                  ),
                                  
                                  const SizedBox(height: 20),
                                  
                                  _buildModernTextField(
                                    controller: _confirmPasswordController,
                                    label: 'Confirm Password',
                                    hint: 'Confirm your password',
                                    obscureText: _obscureConfirmPassword,
                                    isSuccess: _confirmPasswordController.text.isNotEmpty && 
                                              _confirmPasswordController.text == _passwordController.text,
                                    suffixIcon: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        if (_confirmPasswordController.text.isNotEmpty && 
                                            _confirmPasswordController.text == _passwordController.text)
                                          const Padding(
                                            padding: EdgeInsets.only(right: 8),
                                            child: Icon(
                                              Icons.check_circle,
                                              color: Colors.green,
                                              size: 20,
                                            ),
                                          ),
                                        IconButton(
                                          icon: Icon(
                                            _obscureConfirmPassword ? Icons.visibility : Icons.visibility_off,
                                            color: Colors.grey[600],
                                          ),
                                          onPressed: () {
                                            setState(() {
                                              _obscureConfirmPassword = !_obscureConfirmPassword;
                                            });
                                          },
                                        ),
                                      ],
                                    ),
                                    validator: (value) {
                                      if (value == null || value.isEmpty) {
                                        return 'Please confirm your password';
                                      }
                                      if (value != _passwordController.text) {
                                        return 'Passwords do not match';
                                      }
                                      return null;
                                    },
                                    onChanged: (value) {
                                      setState(() {
                                        // Trigger rebuild to update confirm password validation
                                      });
                                    },
                                  ),
                                  
                                  const SizedBox(height: 20),
                                  
                                  _buildModernTextField(
                                    controller: _phoneController,
                                    label: 'Phone Number (Optional)',
                                    hint: 'Enter your phone number',
                                    keyboardType: TextInputType.phone,
                                  ),
                                  
                                  const SizedBox(height: 20),
                                  
                                  _buildModernTextField(
                                    controller: _addressController,
                                    label: 'Address (Optional)',
                                    hint: 'Enter your address',
                                    maxLines: 2,
                                  ),
                                  
                                  const SizedBox(height: 20),
                                  
                                  _buildModernTextField(
                                    controller: _educationController,
                                    label: 'Last Education (Optional)',
                                    hint: 'Enter your last education',
                                  ),
                                ],
                              ),
                            ),
                      
                            // Organizer specific fields
                            if (_selectedRole == 'ORGANIZER') ...[
                              const SizedBox(height: 16),
                              
                              Container(
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: Colors.grey[200]!),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.02),
                                      blurRadius: 10,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Organization Details',
                                      style: TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.black,
                                      ),
                                    ),
                                    
                                    const SizedBox(height: 20),
                                    
                                    if (_selectedOrganizerType == 'COMMUNITY') ...[
                                      SimpleTextField(
                                        controller: _communityNameController,
                                        label: 'Community Name',
                                        hintText: 'Enter community name',
                                        prefixIcon: const Icon(Icons.group_outlined),
                                        validator: (value) {
                                          if (value == null || value.isEmpty) {
                                            return 'Please enter community name';
                                          }
                                          return null;
                                        },
                                      ),
                                      
                                      const SizedBox(height: 16),
                                      
                                      SimpleTextField(
                                        controller: _contactPersonController,
                                        label: 'Contact Person',
                                        hintText: 'Enter contact person name',
                                        prefixIcon: const Icon(Icons.person_outlined),
                                      ),
                                    ],
                                    
                                    if (_selectedOrganizerType == 'SMALL_BUSINESS') ...[
                                      SimpleTextField(
                                        controller: _businessNameController,
                                        label: 'Business Name',
                                        hintText: 'Enter business name',
                                        prefixIcon: const Icon(Icons.business_outlined),
                                        validator: (value) {
                                          if (value == null || value.isEmpty) {
                                            return 'Please enter business name';
                                          }
                                          return null;
                                        },
                                      ),
                                    ],
                                    
                                    if (_selectedOrganizerType == 'INSTITUTION') ...[
                                      SimpleTextField(
                                        controller: _institutionNameController,
                                        label: 'Institution Name',
                                        hintText: 'Enter institution name',
                                        prefixIcon: const Icon(Icons.school_outlined),
                                        validator: (value) {
                                          if (value == null || value.isEmpty) {
                                            return 'Please enter institution name';
                                          }
                                          return null;
                                        },
                                      ),
                                      
                                      const SizedBox(height: 16),
                                      
                                      SimpleTextField(
                                        controller: _contactPersonController,
                                        label: 'Contact Person',
                                        hintText: 'Enter contact person name',
                                        prefixIcon: const Icon(Icons.person_outlined),
                                      ),
                                    ],
                                    
                                    const SizedBox(height: 16),
                                    
                                    SimpleTextField(
                                      controller: _websiteController,
                                      label: 'Website (Optional)',
                                      hintText: 'Enter website URL',
                                      prefixIcon: const Icon(Icons.language_outlined),
                                      keyboardType: TextInputType.url,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                      
                            const SizedBox(height: 32),
                            
                            // Register Button
                            Container(
                              height: 56,
                              decoration: BoxDecoration(
                                color: const Color(0xFF2563EB),
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF2563EB).withOpacity(0.3),
                                    blurRadius: 15,
                                    offset: const Offset(0, 8),
                                  ),
                                ],
                              ),
                              child: ElevatedButton(
                                onPressed: _handleRegister,
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
                                        'Create Account',
                                        style: TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.white,
                                        ),
                                      ),
                              ),
                            ),
                            
                            const SizedBox(height: 32),
                            
                            // Login Link
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  'Already have an account? ',
                                  style: TextStyle(
                                    color: Colors.grey[600],
                                    fontSize: 16,
                                  ),
                                ),
                                TextButton(
                                  onPressed: () => context.go('/login'),
                                  style: TextButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(horizontal: 8),
                                  ),
                                  child: const Text(
                                    'Sign In',
                                    style: TextStyle(
                                      color: Colors.black87,
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            
                            const SizedBox(height: 32),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

