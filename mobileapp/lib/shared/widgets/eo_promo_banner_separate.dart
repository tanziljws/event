import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../services/upgrade_service.dart';
import '../../features/auth/bloc/auth_bloc.dart';

/// Banner promosi terpisah untuk upgrade menjadi Event Organizer dengan carousel teks
class EOPromoBannerSeparate extends StatefulWidget {
  const EOPromoBannerSeparate({super.key});

  @override
  State<EOPromoBannerSeparate> createState() => _EOPromoBannerSeparateState();
}

class _EOPromoBannerSeparateState extends State<EOPromoBannerSeparate>
    with TickerProviderStateMixin, AutomaticKeepAliveClientMixin {
  late AnimationController _animationController;
  late PageController _pageController;
  int _currentIndex = 0;

  @override
  bool get wantKeepAlive => true; // Keep state alive for performance

  // Template kata-kata untuk carousel - Participant
  final List<String> _participantDescriptionTexts = [
    'Buat event sendiri dan dapatkan peserta lebih banyak',
    'Kelola event dengan mudah dan profesional',
    'Dapatkan akses ke fitur EO premium',
    'Bangun komunitas dan jaringan yang luas',
    'Generate sertifikat otomatis untuk peserta',
    'Analisis performa event secara detail',
    'Terima pembayaran dengan sistem yang aman',
    'Dapatkan support prioritas dari tim kami',
  ];

  // Template kata-kata untuk carousel - Organizer
  final List<String> _organizerDescriptionTexts = [
    'Tingkatkan ke Premium Plan untuk fitur lebih',
    'Akses fitur marketing dan promosi advanced',
    'Dapatkan analytics dan reporting yang detail',
    'Support prioritas dan konsultasi eksklusif',
    'Integrasi dengan platform eksternal',
    'Custom branding dan white-label options',
    'API access untuk integrasi sistem',
    'Training dan workshop khusus EO',
  ];

  // Template kata-kata untuk carousel - Guest (belum login)
  final List<String> _guestDescriptionTexts = [
    'Daftar sekarang, jelajahi ribuan event di daerahmu',
    'Temukan event menarik di sekitar lokasimu',
    'Bergabung dengan komunitas event terbesar',
    'Akses event gratis dan berbayar dengan mudah',
    'Dapatkan notifikasi event terbaru di daerahmu',
    'Buat akun dan nikmati fitur eksklusif',
    'Gabung sekarang, dapatkan pengalaman terbaik',
    'Temukan passion baru melalui event-event menarik',
  ];

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
    _pageController = PageController();
    
    // Auto scroll carousel
    _startAutoScroll();
  }

  void _startAutoScroll() {
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        _nextText();
        _startAutoScroll();
      }
    });
  }

  void _nextText() {
    // Use guest texts as default for auto-scroll (for non-authenticated users)
    final texts = _guestDescriptionTexts;
    if (_currentIndex < texts.length - 1) {
      _currentIndex++;
    } else {
      _currentIndex = 0;
    }
    
    if (_pageController.hasClients) {
      _pageController.animateToPage(
        _currentIndex,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
      );
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context); // Required for AutomaticKeepAliveClientMixin
    
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, authState) {
        if (authState is AuthAuthenticated) {
          return _buildBanner(context, authState.user);
        } else {
          return _buildGuestBanner(context); // Show banner for non-authenticated users
        }
      },
    );
  }

  Widget _buildBanner(BuildContext context, dynamic user) {
    // Determine if user is organizer
    final isOrganizer = user.role == 'ORGANIZER' && user.verificationStatus == 'APPROVED';
    final descriptionTexts = isOrganizer ? _organizerDescriptionTexts : _participantDescriptionTexts;
    final title = isOrganizer ? 'Upgrade Premium?' : 'Mau jadi EO?';
    final buttonText = isOrganizer ? 'Upgrade Premium' : 'Upgrade Sekarang';
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          stops: [0.0, 0.3, 0.7, 1.0], // Smooth transition points
          colors: [
            Color(0xFF3B82F6), // Blue
            Color(0xFF2563EB), // Medium blue
            Color(0xFF1E40AF), // Darker blue
            Color(0xFF1D4ED8), // Deep blue
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF3B82F6).withOpacity(0.2),
            blurRadius: 16,
            offset: const Offset(0, 6),
            spreadRadius: 0,
          ),
          BoxShadow(
            color: const Color(0xFF1E40AF).withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
            spreadRadius: 0,
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _handleUpgradeEO(context),
          borderRadius: BorderRadius.circular(16),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.white.withOpacity(0.1),
                  Colors.transparent,
                  Colors.white.withOpacity(0.05),
                ],
                stops: const [0.0, 0.5, 1.0],
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  // Content
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                      // Main headline
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      // Carousel description
                      SizedBox(
                        height: 40, // Fixed height for carousel
                        child: PageView.builder(
                          controller: _pageController,
                          itemCount: descriptionTexts.length,
                          onPageChanged: (index) {
                            setState(() {
                              _currentIndex = index;
                            });
                          },
                          itemBuilder: (context, index) {
                            return AnimatedBuilder(
                              animation: _animationController,
                              builder: (context, child) {
                                return Align(
                                  alignment: Alignment.centerLeft,
                                  child: Text(
                                    descriptionTexts[index],
                                    style: const TextStyle(
                                      fontSize: 14,
                                      color: Colors.white70,
                                      height: 1.2,
                                    ),
                                    textAlign: TextAlign.left,
                                  ),
                                );
                              },
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 16),
                      // CTA Button
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Text(
                          buttonText,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF3B82F6),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGuestBanner(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          stops: [0.0, 0.3, 0.7, 1.0], // Smooth transition points
          colors: [
            Color(0xFF3B82F6), // Blue
            Color(0xFF2563EB), // Medium blue
            Color(0xFF1E40AF), // Darker blue
            Color(0xFF1D4ED8), // Deep blue
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF3B82F6).withOpacity(0.2),
            blurRadius: 16,
            offset: const Offset(0, 6),
            spreadRadius: 0,
          ),
          BoxShadow(
            color: const Color(0xFF1E40AF).withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
            spreadRadius: 0,
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _handleGuestAction(context),
          borderRadius: BorderRadius.circular(16),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.white.withOpacity(0.1),
                  Colors.transparent,
                  Colors.white.withOpacity(0.05),
                ],
                stops: const [0.0, 0.5, 1.0],
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  // Content
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Main headline
                        const Text(
                          'Gabung Sekarang!',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 8),
                        // Carousel description
                        SizedBox(
                          height: 40, // Fixed height for carousel
                          child: PageView.builder(
                            controller: _pageController,
                            itemCount: _guestDescriptionTexts.length,
                            onPageChanged: (index) {
                              setState(() {
                                _currentIndex = index;
                              });
                            },
                            itemBuilder: (context, index) {
                              return AnimatedBuilder(
                                animation: _animationController,
                                builder: (context, child) {
                                  return Align(
                                    alignment: Alignment.centerLeft,
                                    child: Text(
                                      _guestDescriptionTexts[index],
                                      style: const TextStyle(
                                        fontSize: 14,
                                        color: Colors.white70,
                                        height: 1.2,
                                      ),
                                      textAlign: TextAlign.left,
                                    ),
                                  );
                                },
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 16),
                        // CTA Button
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Text(
                            'Daftar Sekarang',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF3B82F6),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _handleGuestAction(BuildContext context) {
    // Redirect to registration page
    context.go('/register');
  }

  void _handleUpgradeEO(BuildContext context) async {
    final authState = context.read<AuthBloc>().state;
    
    if (authState is! AuthAuthenticated) {
      // User is not authenticated, redirect to login
      context.go('/login');
      return;
    }

    try {
      // Check upgrade status
      final status = await UpgradeService.getUpgradeStatus();

      if (status['success'] == true) {
        final userData = status['data'];
        final verificationStatus = userData?['verificationStatus'];
        final role = userData?['role'];

        if (role == 'ORGANIZER' && verificationStatus == 'APPROVED') {
          // User is already approved organizer - show premium upgrade options
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Mengecek paket Premium yang tersedia...'),
              backgroundColor: Colors.blue,
            ),
          );
          // Navigate to premium pricing page
          context.go('/pricing?plan=premium');
          return;
        } else if (role == 'ORGANIZER' && verificationStatus == 'PENDING') {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Aplikasi EO Anda sedang dalam review'),
              backgroundColor: Colors.orange,
            ),
          );
          return;
        } else if (role == 'ORGANIZER' && verificationStatus == 'REJECTED') {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Aplikasi sebelumnya ditolak. Anda bisa mengajukan ulang'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }

      // Navigate to pricing page first
      context.go('/pricing');
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error checking upgrade status: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
