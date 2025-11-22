import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/models/pricing_model.dart';
import '../../../core/constants/app_constants.dart';
import '../../auth/bloc/auth_bloc.dart';

class PricingPage extends StatefulWidget {
  const PricingPage({super.key});

  @override
  State<PricingPage> createState() => _PricingPageState();
}

class _PricingPageState extends State<PricingPage> with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  
  int _selectedPlanIndex = 1; // Default to Premium (recommended)
  bool _isAnnual = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
    
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOutCubic,
    ));
    
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _handlePlanClick(String planName) async {
    final authState = context.read<AuthBloc>().state;
    
    if (authState is AuthAuthenticated) {
      final user = authState.user;
      
      // For Pro plan (free), always go to upgrade page regardless of role
      if (planName == 'Pro') {
        context.go('/upgrade');
        return;
      }
      
      // For paid plans, check if user can upgrade
      if (user.role == 'PARTICIPANT') {
        // Participant can upgrade to paid plans
        context.go('/upgrade?plan=${planName.toLowerCase()}');
      } else if (user.role == 'ORGANIZER') {
        // Check if organizer status is rejected (can re-apply)
        if (user.verificationStatus == 'REJECTED') {
          // Organizer with rejected status can upgrade again
          context.go('/upgrade?plan=${planName.toLowerCase()}');
        } else {
          // Already approved organizer - redirect to dashboard
          context.go('/dashboard');
        }
      } else {
        // Other roles - redirect to dashboard
        context.go('/dashboard');
      }
    } else {
      // Not logged in - redirect to register with plan
      context.go('/register?plan=${planName.toLowerCase()}');
    }
  }

  @override
  Widget build(BuildContext context) {
    final pricingPlans = PricingService.getPricingPlans();
    
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        title: const Text(
          'Pricing Plans',
          style: TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.bold,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () {
            if (Navigator.of(context).canPop()) {
              Navigator.of(context).pop();
            } else {
              context.go('/home');
            }
          },
        ),
      ),
      body: AnimatedBuilder(
        animation: _animationController,
        builder: (context, child) {
          return FadeTransition(
            opacity: _fadeAnimation,
            child: SlideTransition(
              position: _slideAnimation,
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    // Header Section
                    _buildHeader(),
                    
                    // Billing Toggle
                    _buildBillingToggle(),
                    
                    const SizedBox(height: 32),
                    
                    // Pricing Cards
                    _buildPricingCards(pricingPlans),
                    
                    const SizedBox(height: 24),
                    
                    // FAQ Section (Compact)
                    _buildCompactFAQ(),
                    
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Text(
            'Pilih Paket',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.grey[900],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Mulai dari gratis hingga enterprise',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildBillingToggle() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _isAnnual = false),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: _isAnnual ? Colors.transparent : Colors.white,
                  borderRadius: BorderRadius.circular(6),
                  boxShadow: _isAnnual ? null : [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 2,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
                child: Text(
                  'Bulanan',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: _isAnnual ? Colors.grey[600] : Colors.black,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _isAnnual = true),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: _isAnnual ? Colors.white : Colors.transparent,
                  borderRadius: BorderRadius.circular(6),
                  boxShadow: _isAnnual ? [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 2,
                      offset: const Offset(0, 1),
                    ),
                  ] : null,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Tahunan',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: _isAnnual ? Colors.black : Colors.grey[600],
                      ),
                    ),
                    const SizedBox(width: 2),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                      decoration: BoxDecoration(
                        color: Colors.green[100],
                        borderRadius: BorderRadius.circular(3),
                      ),
                      child: Text(
                        '-20%',
                        style: TextStyle(
                          fontSize: 8,
                          fontWeight: FontWeight.w600,
                          color: Colors.green[700],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPricingCards(List<PricingPlan> plans) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Column(
        children: plans.asMap().entries.map((entry) {
          final index = entry.key;
          final plan = entry.value;
          final colors = PricingService.getColorClasses(plan.color);
          final isRecommended = plan.badge == 'Rekomendasi';
          final isSelected = _selectedPlanIndex == index;
          
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            child: GestureDetector(
              onTap: () => setState(() => _selectedPlanIndex = index),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isSelected ? colors['bg'] : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected ? colors['border'] : Colors.grey[200]!,
                    width: isSelected ? 2 : 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(isSelected ? 0.08 : 0.03),
                      blurRadius: isSelected ? 8 : 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    // Header Row with Badge and Icon
                    Row(
                      children: [
                        // Icon
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: colors['bg'],
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            _getPlanIcon(plan.icon),
                            size: 20,
                            color: colors['icon'],
                          ),
                        ),
                        const SizedBox(width: 12),
                        
                        // Plan Name and Badge
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    plan.name,
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: colors['text'],
                                    ),
                                  ),
                                  if (plan.badge.isNotEmpty) ...[
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: isRecommended ? AppConstants.primaryColor : Colors.grey[800],
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        plan.badge,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 8,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              Text(
                                plan.description,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 12),
                    
                    // Price and Commission Row
                    Row(
                      children: [
                        // Price
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _isAnnual ? plan.price.annual : plan.price.monthly,
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: colors['text'],
                                ),
                              ),
                              if (plan.price.monthly != 'Gratis')
                                Text(
                                  _isAnnual ? 'per tahun' : 'per bulan',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: Colors.grey[600],
                                  ),
                                ),
                            ],
                          ),
                        ),
                        
                        // Commission
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: colors['bg'],
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Column(
                            children: [
                              Text(
                                'Komisi',
                                style: TextStyle(
                                  fontSize: 8,
                                  color: Colors.grey[600],
                                ),
                              ),
                              Text(
                                plan.commission,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: colors['text'],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 12),
                    
                    // Key Features (only 3 most important)
                    ...plan.features.take(3).map((feature) => _buildCompactFeatureItem(feature)),
                    
                    const SizedBox(height: 12),
                    
                    // CTA Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => _handlePlanClick(plan.name),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: colors['button'],
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          elevation: 1,
                        ),
                        child: Text(
                          _getButtonText(plan.name),
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildCompactFeatureItem(PricingFeature feature) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Icon(
            feature.included ? Icons.check_circle : Icons.cancel,
            size: 12,
            color: feature.included ? Colors.green[500] : Colors.grey[400],
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              feature.name,
              style: TextStyle(
                fontSize: 11,
                color: feature.included ? Colors.grey[800] : Colors.grey[500],
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }



  Widget _buildCompactFAQ() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'FAQ',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.grey[900],
            ),
          ),
          const SizedBox(height: 12),
          
          // FAQ Items
          _buildFAQItem('Bagaimana cara kerja komisi?', 'Komisi dihitung dari setiap ticket yang berhasil terjual melalui platform kami.'),
          _buildFAQItem('Ada biaya setup?', 'Paket Pro dan Premium tidak ada biaya setup. Hanya Supervisor yang ada setup fee Rp 2.000.000.'),
          _buildFAQItem('Bisa upgrade paket?', 'Ya, Anda bisa upgrade atau downgrade paket kapan saja.'),
        ],
      ),
    );
  }

  Widget _buildFAQItem(String question, String answer) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            question,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.grey[900],
            ),
          ),
          const SizedBox(height: 4),
          Text(
            answer,
            style: TextStyle(
              fontSize: 11,
              color: Colors.grey[600],
              height: 1.3,
            ),
          ),
        ],
      ),
    );
  }

  String _getButtonText(String planName) {
    final authState = context.read<AuthBloc>().state;
    
    if (authState is AuthAuthenticated) {
      final user = authState.user;
      
      // For Pro plan (free), check if user is already an organizer
      if (planName == 'Pro') {
        if (user.role == 'ORGANIZER' && user.verificationStatus == 'APPROVED') {
          return 'Lihat Dashboard'; // ✅ Hanya Pro yang berubah
        } else {
          return 'Mulai Gratis';
        }
      }
      
      // For paid plans (Premium/Supervisor), always show "Pilih" even for approved organizers
      // because they can upgrade to paid plans
      if (user.role == 'PARTICIPANT') {
        return 'Pilih ${planName}';
      } else if (user.role == 'ORGANIZER') {
        if (user.verificationStatus == 'REJECTED') {
          return 'Pilih ${planName}';
        } else {
          // Approved organizer can still upgrade to paid plans
          return 'Pilih ${planName}'; // ✅ Tetap "Pilih" untuk paket berbayar
        }
      } else {
        return 'Pilih ${planName}';
      }
    } else {
      // Not logged in
      return planName == 'Pro' ? 'Mulai Gratis' : 'Pilih ${planName}';
    }
  }

  IconData _getPlanIcon(String iconName) {
    switch (iconName) {
      case 'zap':
        return Icons.flash_on;
      case 'star':
        return Icons.star;
      case 'crown':
        return Icons.workspace_premium;
      default:
        return Icons.business;
    }
  }

}
