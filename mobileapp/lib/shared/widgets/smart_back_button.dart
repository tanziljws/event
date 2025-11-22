import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/navigation/navigation_history_manager.dart';

class SmartBackButton extends StatelessWidget {
  final Color? color;
  final double? size;
  final VoidCallback? onPressed;

  const SmartBackButton({
    super.key,
    this.color,
    this.size,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    final historyManager = NavigationHistoryManager();
    final canGoBack = historyManager.hasPreviousRoute();

    return IconButton(
      icon: Icon(
        Icons.arrow_back,
        color: color ?? Theme.of(context).iconTheme.color,
        size: size ?? 24,
      ),
      onPressed: onPressed ?? () {
        if (canGoBack) {
          context.smartBack();
        } else {
          // Fallback to home if no history
          context.go('/home');
        }
      },
      tooltip: canGoBack ? 'Kembali ke halaman sebelumnya' : 'Kembali ke beranda',
    );
  }
}

class SmartAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final bool centerTitle;
  final double elevation;
  final Widget? leading;

  const SmartAppBar({
    super.key,
    required this.title,
    this.actions,
    this.backgroundColor,
    this.foregroundColor,
    this.centerTitle = true,
    this.elevation = 0,
    this.leading,
  });

  @override
  Widget build(BuildContext context) {
    final historyManager = NavigationHistoryManager();
    final canGoBack = historyManager.hasPreviousRoute();

    return AppBar(
      title: Text(
        title,
        style: TextStyle(
          color: foregroundColor ?? Theme.of(context).textTheme.titleLarge?.color,
          fontWeight: FontWeight.w600,
        ),
      ),
      centerTitle: centerTitle,
      backgroundColor: backgroundColor ?? Theme.of(context).scaffoldBackgroundColor,
      foregroundColor: foregroundColor ?? Theme.of(context).textTheme.titleLarge?.color,
      elevation: elevation,
      leading: leading ?? (canGoBack ? SmartBackButton() : null),
      actions: actions,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

/// Smart back button untuk floating action button
class SmartFloatingBackButton extends StatelessWidget {
  final Color? backgroundColor;
  final Color? foregroundColor;
  final String? tooltip;

  const SmartFloatingBackButton({
    super.key,
    this.backgroundColor,
    this.foregroundColor,
    this.tooltip,
  });

  @override
  Widget build(BuildContext context) {
    final historyManager = NavigationHistoryManager();
    final canGoBack = historyManager.hasPreviousRoute();

    return FloatingActionButton(
      onPressed: () {
        if (canGoBack) {
          context.smartBack();
        } else {
          context.go('/home');
        }
      },
      backgroundColor: backgroundColor ?? Theme.of(context).primaryColor,
      foregroundColor: foregroundColor ?? Colors.white,
      tooltip: tooltip ?? (canGoBack ? 'Kembali ke halaman sebelumnya' : 'Kembali ke beranda'),
      child: const Icon(Icons.arrow_back),
    );
  }
}
