import 'package:flutter/material.dart';

/// Custom trash button dengan style seperti CSS dari Uiverse.io
/// Tanpa animasi sesuai permintaan user
class CustomTrashButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final double size;
  final Color? color;

  const CustomTrashButton({
    super.key,
    this.onPressed,
    this.size = 20.0,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        padding: const EdgeInsets.all(2.0),
        decoration: BoxDecoration(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(2),
        ),
        child: Stack(
          children: [
            // Drop shadow (subtle)
            Positioned(
              left: 0.5,
              top: 0.5,
              child: Icon(
                Icons.delete_outline,
                size: size,
                color: Colors.black.withOpacity(0.05),
              ),
            ),
            // Main icon
            Icon(
              Icons.delete_outline,
              size: size,
              color: color ?? Colors.red[600],
            ),
          ],
        ),
      ),
    );
  }
}
