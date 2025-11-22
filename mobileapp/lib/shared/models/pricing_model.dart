import 'package:flutter/material.dart';

class PricingPlan {
  final String name;
  final String description;
  final String icon;
  final String color;
  final String badge;
  final String commission;
  final PricingPrice price;
  final List<PricingFeature> features;
  final List<String> limitations;

  const PricingPlan({
    required this.name,
    required this.description,
    required this.icon,
    required this.color,
    required this.badge,
    required this.commission,
    required this.price,
    required this.features,
    required this.limitations,
  });

  factory PricingPlan.fromJson(Map<String, dynamic> json) {
    return PricingPlan(
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      icon: json['icon'] ?? '',
      color: json['color'] ?? '',
      badge: json['badge'] ?? '',
      commission: json['commission'] ?? '',
      price: PricingPrice.fromJson(json['price'] ?? {}),
      features: (json['features'] as List<dynamic>?)
          ?.map((feature) => PricingFeature.fromJson(feature))
          .toList() ?? [],
      limitations: (json['limitations'] as List<dynamic>?)
          ?.map((limitation) => limitation.toString())
          .toList() ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'description': description,
      'icon': icon,
      'color': color,
      'badge': badge,
      'commission': commission,
      'price': price.toJson(),
      'features': features.map((feature) => feature.toJson()).toList(),
      'limitations': limitations,
    };
  }
}

class PricingPrice {
  final String monthly;
  final String annual;

  const PricingPrice({
    required this.monthly,
    required this.annual,
  });

  factory PricingPrice.fromJson(Map<String, dynamic> json) {
    return PricingPrice(
      monthly: json['monthly'] ?? '',
      annual: json['annual'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'monthly': monthly,
      'annual': annual,
    };
  }
}

class PricingFeature {
  final String name;
  final bool included;

  const PricingFeature({
    required this.name,
    required this.included,
  });

  factory PricingFeature.fromJson(Map<String, dynamic> json) {
    return PricingFeature(
      name: json['name'] ?? '',
      included: json['included'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'included': included,
    };
  }
}

class PricingService {
  static List<PricingPlan> getPricingPlans() {
    return [
      PricingPlan(
        name: 'Pro',
        description: 'Paket ideal untuk event organizer pemula',
        icon: 'zap',
        color: 'blue',
        badge: 'Populer',
        commission: '3%',
        price: const PricingPrice(
          monthly: 'Gratis',
          annual: 'Gratis',
        ),
        features: const [
          PricingFeature(name: 'Hingga 5 event per bulan', included: true),
          PricingFeature(name: 'Maksimal 100 peserta per event', included: true),
          PricingFeature(name: 'Template sertifikat dasar', included: true),
          PricingFeature(name: 'QR Code attendance', included: true),
          PricingFeature(name: 'Email notifications', included: true),
          PricingFeature(name: 'Basic analytics', included: true),
          PricingFeature(name: 'Customer support email', included: true),
          PricingFeature(name: 'Custom branding', included: false),
          PricingFeature(name: 'Advanced analytics', included: false),
          PricingFeature(name: 'Priority support', included: false),
          PricingFeature(name: 'White-label solution', included: false),
          PricingFeature(name: 'API access', included: false),
        ],
        limitations: const [
          'Komisi 3% per ticket terjual',
          'Template sertifikat terbatas',
          'Analytics dasar saja',
        ],
      ),
      PricingPlan(
        name: 'Premium',
        description: 'Solusi lengkap untuk event organizer profesional',
        icon: 'star',
        color: 'purple',
        badge: 'Rekomendasi',
        commission: '6%',
        price: const PricingPrice(
          monthly: 'Rp 299.000',
          annual: 'Rp 2.999.000',
        ),
        features: const [
          PricingFeature(name: 'Event tak terbatas', included: true),
          PricingFeature(name: 'Maksimal 500 peserta per event', included: true),
          PricingFeature(name: 'Template sertifikat premium', included: true),
          PricingFeature(name: 'QR Code attendance', included: true),
          PricingFeature(name: 'Email notifications', included: true),
          PricingFeature(name: 'Advanced analytics', included: true),
          PricingFeature(name: 'Custom branding', included: true),
          PricingFeature(name: 'Priority support', included: true),
          PricingFeature(name: 'Social media integration', included: true),
          PricingFeature(name: 'Customer support chat', included: true),
          PricingFeature(name: 'White-label solution', included: false),
          PricingFeature(name: 'API access', included: false),
        ],
        limitations: const [
          'Komisi 6% per ticket terjual',
          'Belum ada white-label',
          'API access terbatas',
        ],
      ),
      PricingPlan(
        name: 'Supervisor',
        description: 'Paket enterprise untuk organisasi besar',
        icon: 'crown',
        color: 'gold',
        badge: 'Enterprise',
        commission: '8%',
        price: const PricingPrice(
          monthly: 'Rp 599.000',
          annual: 'Rp 5.999.000',
        ),
        features: const [
          PricingFeature(name: 'Event tak terbatas', included: true),
          PricingFeature(name: 'Peserta tak terbatas', included: true),
          PricingFeature(name: 'Template sertifikat custom', included: true),
          PricingFeature(name: 'QR Code attendance', included: true),
          PricingFeature(name: 'Email notifications', included: true),
          PricingFeature(name: 'Advanced analytics', included: true),
          PricingFeature(name: 'Custom branding', included: true),
          PricingFeature(name: 'Priority support', included: true),
          PricingFeature(name: 'White-label solution', included: true),
          PricingFeature(name: 'API access penuh', included: true),
          PricingFeature(name: 'Dedicated account manager', included: true),
          PricingFeature(name: 'Custom integrations', included: true),
        ],
        limitations: const [
          'Komisi 8% per ticket terjual',
          'Minimum kontrak 6 bulan',
          'Setup fee Rp 2.000.000',
        ],
      ),
    ];
  }

  static Map<String, dynamic> getColorClasses(String color) {
    switch (color) {
      case 'blue':
        return {
          'bg': const Color(0xFFF8FAFC),
          'border': const Color(0xFFE2E8F0),
          'text': const Color(0xFF1E293B),
          'button': const Color(0xFF1E293B),
          'icon': const Color(0xFF64748B),
        };
      case 'purple':
        return {
          'bg': const Color(0xFFF0F4FF),
          'border': const Color(0xFF2563EB),
          'text': const Color(0xFF2563EB),
          'button': const Color(0xFF2563EB),
          'icon': const Color(0xFF2563EB),
        };
      case 'gold':
        return {
          'bg': const Color(0xFFFEF3C7),
          'border': const Color(0xFFF59E0B),
          'text': const Color(0xFF92400E),
          'button': const Color(0xFFF59E0B),
          'icon': const Color(0xFFF59E0B),
        };
      default:
        return {
          'bg': const Color(0xFFF8FAFC),
          'border': const Color(0xFFE2E8F0),
          'text': const Color(0xFF64748B),
          'button': const Color(0xFF64748B),
          'icon': const Color(0xFF64748B),
        };
    }
  }
}
