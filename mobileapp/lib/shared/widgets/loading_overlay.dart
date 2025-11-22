import 'package:flutter/material.dart';
import 'loading_animations.dart';

class LoadingOverlay extends StatelessWidget {
  final Widget child;
  final bool isLoading;
  final String? loadingText;
  final Color? backgroundColor;
  final Color? loadingColor;
  final LoadingAnimationType animationType;

  const LoadingOverlay({
    super.key,
    required this.child,
    required this.isLoading,
    this.loadingText,
    this.backgroundColor,
    this.loadingColor,
    this.animationType = LoadingAnimationType.circular,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        child,
        if (isLoading)
          Container(
            color: backgroundColor ?? Colors.black.withOpacity(0.3),
            child: Center(
              child: Container(
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildLoadingAnimation(),
                    if (loadingText != null) ...[
                      const SizedBox(height: 20),
                      Text(
                        loadingText!,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                          color: Colors.black87,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildLoadingAnimation() {
    switch (animationType) {
      case LoadingAnimationType.circular:
        return LoadingAnimations.circularLoading(
          size: 50,
          color: loadingColor,
        );
      case LoadingAnimationType.pulse:
        return LoadingAnimations.pulseLoading(
          size: 50,
          color: loadingColor,
        );
      case LoadingAnimationType.bounce:
        return LoadingAnimations.bounceLoading(
          size: 50,
          color: loadingColor,
        );
      case LoadingAnimationType.wave:
        return LoadingAnimations.waveLoading(
          size: 50,
          color: loadingColor,
        );
      case LoadingAnimationType.dots:
        return LoadingAnimations.dotsLoading(
          size: 50,
          color: loadingColor,
        );
    }
  }
}

enum LoadingAnimationType {
  circular,
  pulse,
  bounce,
  wave,
  dots,
}

