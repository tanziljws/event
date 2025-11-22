import 'package:flutter/material.dart';

class SafeMediaQuery {
  static MediaQueryData? maybeOf(BuildContext context) {
    try {
      return MediaQuery.maybeOf(context);
    } catch (e) {
      print('SafeMediaQuery error: $e');
      return null;
    }
  }
  
  static MediaQueryData of(BuildContext context) {
    final data = maybeOf(context);
    if (data != null) {
      return data;
    }
    
    // Fallback MediaQueryData with safe defaults
    return const MediaQueryData(
      size: Size(375, 812), // iPhone 12 Pro size as fallback
      devicePixelRatio: 2.0,
      textScaler: TextScaler.linear(1.0),
      padding: EdgeInsets.only(top: 44, bottom: 34),
      viewInsets: EdgeInsets.zero,
      viewPadding: EdgeInsets.only(top: 44, bottom: 34),
      alwaysUse24HourFormat: false,
      accessibleNavigation: false,
      invertColors: false,
      highContrast: false,
      disableAnimations: false,
      boldText: false,
      navigationMode: NavigationMode.traditional,
      gestureSettings: DeviceGestureSettings(touchSlop: null),
      displayFeatures: <DisplayFeature>[],
    );
  }
  
  static Size sizeOf(BuildContext context) {
    return of(context).size;
  }
  
  static EdgeInsets paddingOf(BuildContext context) {
    return of(context).padding;
  }
  
  static EdgeInsets viewInsetsOf(BuildContext context) {
    return of(context).viewInsets;
  }
  
  static double devicePixelRatioOf(BuildContext context) {
    return of(context).devicePixelRatio;
  }
  
  static TextScaler textScalerOf(BuildContext context) {
    return of(context).textScaler;
  }
}