import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:nusa/shared/widgets/loading_overlay.dart';
import 'package:nusa/features/upgrade/bloc/upgrade_bloc.dart';

class UpgradePage extends StatefulWidget {
  const UpgradePage({super.key});

  @override
  State<UpgradePage> createState() => _UpgradePageState();
}

class _UpgradePageState extends State<UpgradePage> with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  int _currentStep = 1;
  late AnimationController _stepAnimationController;
  late Animation<double> _stepAnimation;
  
  // Form controllers
  final _organizerTypeController = TextEditingController();
  final _businessNameController = TextEditingController();
  final _businessAddressController = TextEditingController();
  final _businessPhoneController = TextEditingController();
  final _contactPersonController = TextEditingController();
  final _websiteController = TextEditingController();
  final _socialMediaController = TextEditingController();
  final _portfolioController = TextEditingController();
  
  // Individual profile controllers
  final _nikController = TextEditingController();
  final _personalAddressController = TextEditingController();
  final _personalPhoneController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _stepAnimationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _stepAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _stepAnimationController, curve: Curves.easeInOut),
    );
    _stepAnimationController.forward();
  }

  @override
  void dispose() {
    _stepAnimationController.dispose();
    _organizerTypeController.dispose();
    _businessNameController.dispose();
    _businessAddressController.dispose();
    _businessPhoneController.dispose();
    _contactPersonController.dispose();
    _websiteController.dispose();
    _socialMediaController.dispose();
    _portfolioController.dispose();
    _nikController.dispose();
    _personalAddressController.dispose();
    _personalPhoneController.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_currentStep < 3) {
      setState(() {
        _currentStep++;
      });
      _stepAnimationController.reset();
      _stepAnimationController.forward();
    }
  }

  void _previousStep() {
    if (_currentStep > 1) {
      setState(() {
        _currentStep--;
      });
      _stepAnimationController.reset();
      _stepAnimationController.forward();
    }
  }

  void _handleUpgrade() {
    print('🚀 UPGRADE: Starting upgrade process...');
    print('🔍 UPGRADE: Form validation...');
    
    if (_formKey.currentState!.validate()) {
      print('✅ UPGRADE: Form validation passed');
      final profileData = _prepareProfileData();
      print('📤 UPGRADE: Profile data: $profileData');
      print('📤 UPGRADE: Organizer type: ${_organizerTypeController.text}');
      
      context.read<UpgradeBloc>().add(UpgradeRequested(organizerType: _organizerTypeController.text, profileData: profileData));
    } else {
      print('❌ UPGRADE: Form validation failed');
    }
  }

  Map<String, dynamic> _prepareProfileData() {
    return {
      'businessName': _businessNameController.text,
      'businessAddress': _businessAddressController.text,
      'businessPhone': _businessPhoneController.text,
      'contactPerson': _contactPersonController.text,
      'website': _websiteController.text,
      'socialMedia': _socialMediaController.text,
      'portfolio': _portfolioController.text,
      'nik': _nikController.text,
      'personalAddress': _personalAddressController.text,
      'personalPhone': _personalPhoneController.text,
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Upgrade to Organizer'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (_currentStep > 1) {
              _previousStep();
            } else {
              context.go('/home');
            }
          },
        ),
      ),
      body: BlocListener<UpgradeBloc, UpgradeState>(
          listener: (context, state) {
            if (state is UpgradeSuccess) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.response.message),
                  backgroundColor: Colors.green,
                ),
              );
              context.go('/dashboard');
            } else if (state is UpgradeFailure) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.message),
                  backgroundColor: Colors.red,
                ),
              );
            }
          },
                        child: BlocBuilder<UpgradeBloc, UpgradeState>(
            builder: (context, state) {
              return LoadingOverlay(
                isLoading: state is UpgradeLoading,
                child: Column(
                  children: [
                    // Progress Indicator
                    _buildProgressIndicator(),
                    
                    // Step Title
                    _buildStepTitle(),
                    
                    // Content
                    Expanded(
                      child: SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              // Step Content
                              AnimatedBuilder(
                                animation: _stepAnimation,
                                builder: (context, child) {
                                  return Transform.translate(
                                    offset: Offset(0, 30 * (1 - _stepAnimation.value)),
                                    child: Opacity(
                                      opacity: _stepAnimation.value,
                                      child: _buildStepContent(),
                                    ),
                                  );
                                },
                              ),
                              
                              const SizedBox(height: 32),
                              
                              // Navigation Buttons
                              _buildNavigationButtons(),
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

  /// Build step content based on current step
  Widget _buildStepContent() {
    switch (_currentStep) {
      case 1:
        return _buildStep1Content();
      case 2:
        return _buildStep2Content();
      case 3:
        return _buildStep3Content();
      default:
        return _buildStep1Content();
    }
  }

  /// Build navigation buttons
  Widget _buildNavigationButtons() {
    return Row(
      children: [
        if (_currentStep > 1)
          Expanded(
            child: ElevatedButton(
              onPressed: _previousStep,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.grey[300],
                foregroundColor: Colors.black87,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Previous'),
            ),
          ),
        if (_currentStep > 1) const SizedBox(width: 16),
        Expanded(
          child: ElevatedButton(
            onPressed: _currentStep < 3 ? _nextStep : _handleUpgrade,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2563EB),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(_currentStep < 3 ? 'Next' : 'Submit Upgrade'),
          ),
        ),
      ],
    );
  }

  /// Build step 1 content - Organization Type
  Widget _buildStep1Content() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Organization Type',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 16),
        _buildModernDropdown(),
        const SizedBox(height: 24),
        const Text(
          'Please select your organization type to continue with the upgrade process.',
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey,
          ),
        ),
      ],
    );
  }

  /// Build modern dropdown
  Widget _buildModernDropdown() {
    return SizedBox(
      width: double.infinity,
          child: DropdownButtonFormField<String>(
        initialValue: _organizerTypeController.text.isEmpty ? null : _organizerTypeController.text,
            decoration: InputDecoration(
          labelText: 'Organization Type',
          labelStyle: const TextStyle(color: Color(0xFF2563EB)),
              border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFF2563EB)),
              ),
              enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFF2563EB)),
              ),
              focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFF2563EB), width: 2),
              ),
              filled: true,
              fillColor: Colors.grey[50],
        ),
        items: const [
          DropdownMenuItem(
            value: 'INDIVIDUAL',
            child: Row(
              children: [
                Icon(Icons.person, color: Color(0xFF2563EB)),
                SizedBox(width: 8),
                Text('Individual'),
              ],
            ),
          ),
          DropdownMenuItem(
            value: 'CORPORATE',
                  child: Row(
                    children: [
                Icon(Icons.business, color: Color(0xFF2563EB)),
                SizedBox(width: 8),
                Text('Corporate'),
              ],
            ),
          ),
          DropdownMenuItem(
            value: 'INSTITUTION',
            child: Row(
              children: [
                Icon(Icons.school, color: Color(0xFF2563EB)),
                SizedBox(width: 8),
                Text('Institution'),
                    ],
                  ),
                ),
        ],
            onChanged: (value) {
          if (value != null) {
            _organizerTypeController.text = value;
          }
        },
        validator: (value) {
          if (value == null || value.isEmpty) {
            return 'Please select an organization type';
          }
          return null;
        },
      ),
    );
  }

  /// Build step 2 content - Business Information
  Widget _buildStep2Content() {
    final isIndividual = _organizerTypeController.text == 'INDIVIDUAL';
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          isIndividual ? 'Personal Information' : 'Business Information',
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 24),
        
        // Individual profile fields
        if (isIndividual) ...[
          _buildModernTextField(
            controller: _nikController,
            label: 'NIK/KTP',
            hint: 'Enter your NIK/KTP number',
            icon: Icons.credit_card,
            keyboardType: TextInputType.number,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'NIK/KTP is required';
              }
              if (value.length < 16) {
                return 'NIK/KTP must be at least 16 digits';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          _buildModernTextField(
            controller: _personalAddressController,
            label: 'Personal Address',
            hint: 'Enter your personal address',
            icon: Icons.location_on,
            maxLines: 3,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Personal address is required';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          _buildModernTextField(
            controller: _personalPhoneController,
            label: 'Personal Phone',
            hint: 'Enter your personal phone number',
            icon: Icons.phone,
            keyboardType: TextInputType.phone,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Personal phone is required';
              }
              return null;
            },
          ),
        ] else ...[
          // Business profile fields
          _buildModernTextField(
            controller: _businessNameController,
            label: 'Business Name',
            hint: 'Enter your business name',
            icon: Icons.business,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Business name is required';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
        _buildModernTextField(
          controller: _businessAddressController,
          label: 'Business Address',
            hint: 'Enter your business address',
            icon: Icons.location_on,
          maxLines: 3,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Business address is required';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          _buildModernTextField(
            controller: _businessPhoneController,
            label: 'Business Phone',
            hint: 'Enter your business phone number',
            icon: Icons.phone,
            keyboardType: TextInputType.phone,
          ),
          const SizedBox(height: 16),
        _buildModernTextField(
          controller: _contactPersonController,
          label: 'Contact Person',
            hint: 'Enter contact person name',
            icon: Icons.person,
          ),
        ],
      ],
    );
  }

  /// Build step 3 content - Additional Information
  Widget _buildStep3Content() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Additional Information',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 24),
        _buildModernTextField(
          controller: _websiteController,
          label: 'Website',
          hint: 'Enter your website URL',
          icon: Icons.language,
          keyboardType: TextInputType.url,
        ),
        const SizedBox(height: 16),
        _buildModernTextField(
          controller: _socialMediaController,
          label: 'Social Media',
          hint: 'Enter your social media handles',
          icon: Icons.share,
        ),
        const SizedBox(height: 16),
        _buildModernTextField(
          controller: _portfolioController,
          label: 'Portfolio',
          hint: 'Enter your portfolio or previous work',
          icon: Icons.work,
          maxLines: 3,
        ),
        const SizedBox(height: 24),
        const Text(
          'Review your information before submitting.',
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey,
          ),
        ),
      ],
    );
  }

  /// Build modern text field
  Widget _buildModernTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    TextInputType? keyboardType,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
              controller: controller,
      keyboardType: keyboardType,
              maxLines: maxLines,
              decoration: InputDecoration(
                labelText: label,
        hintText: hint,
        labelStyle: const TextStyle(color: Color(0xFF2563EB)),
                border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF2563EB)),
                ),
                enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF2563EB)),
                ),
                focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF2563EB), width: 2),
                ),
                filled: true,
        fillColor: Colors.grey[50],
        prefixIcon: Icon(icon, color: const Color(0xFF2563EB)),
      ),
      validator: validator,
    );
  }

  /// Build progress indicator
  Widget _buildProgressIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Row(
        children: List.generate(3, (index) {
          final step = index + 1;
          final isActive = step <= _currentStep;
          final isCompleted = step < _currentStep;
          
          return Expanded(
            child: Row(
      children: [
        Container(
                  width: 32,
                  height: 32,
          decoration: BoxDecoration(
                    color: isActive ? const Color(0xFF2563EB) : Colors.grey[300],
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: isCompleted
                        ? const Icon(Icons.check, color: Colors.white, size: 20)
                        : Text(
                            '$step',
                style: TextStyle(
                              color: isActive ? Colors.white : Colors.grey[600],
                  fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                ),
                if (index < 2)
                  Expanded(
                    child: Container(
                      height: 2,
                      color: isCompleted ? const Color(0xFF2563EB) : Colors.grey[300],
                    ),
                  ),
                ],
              ),
          );
        }),
      ),
    );
  }

  /// Build step title
  Widget _buildStepTitle() {
    String title;
    switch (_currentStep) {
      case 1:
        title = 'Step 1: Organization Type';
        break;
      case 2:
        final isIndividual = _organizerTypeController.text == 'INDIVIDUAL';
        title = isIndividual ? 'Step 2: Personal Information' : 'Step 2: Business Information';
        break;
      case 3:
        title = 'Step 3: Additional Information';
        break;
      default:
        title = 'Step 1: Organization Type';
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
            child: Text(
        title,
              style: const TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: Colors.black87,
        ),
      ),
    );
  }
}