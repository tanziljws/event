import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class OtpInputField extends StatefulWidget {
  final int length;
  final ValueChanged<String> onChanged;
  final VoidCallback? onComplete;
  final String? Function(String?)? validator;
  final bool enabled;
  final Color? fillColor;
  final Color? borderColor;
  final Color? textColor;
  final double? fontSize;
  final double? width;
  final double? height;

  const OtpInputField({
    super.key,
    this.length = 6,
    required this.onChanged,
    this.onComplete,
    this.validator,
    this.enabled = true,
    this.fillColor,
    this.borderColor,
    this.textColor,
    this.fontSize,
    this.width,
    this.height,
  });

  @override
  State<OtpInputField> createState() => _OtpInputFieldState();
}

class _OtpInputFieldState extends State<OtpInputField> {
  late List<TextEditingController> _controllers;
  late List<FocusNode> _focusNodes;
  String _otpValue = '';

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(
      widget.length,
      (index) => TextEditingController(),
    );
    _focusNodes = List.generate(
      widget.length,
      (index) => FocusNode(),
    );
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var focusNode in _focusNodes) {
      focusNode.dispose();
    }
    super.dispose();
  }

  void _onTextChanged(String value, int index) {
    if (value.length == 1) {
      // Move to next field
      if (index < widget.length - 1) {
        _focusNodes[index + 1].requestFocus();
      } else {
        _focusNodes[index].unfocus();
      }
    } else if (value.isEmpty) {
      // Move to previous field
      if (index > 0) {
        _focusNodes[index - 1].requestFocus();
      }
    }

    _updateOtpValue();
  }

  void _onKeyEvent(RawKeyEvent event, int index) {
    if (event is RawKeyDownEvent) {
      if (event.logicalKey == LogicalKeyboardKey.backspace) {
        if (_controllers[index].text.isEmpty && index > 0) {
          _focusNodes[index - 1].requestFocus();
        }
      }
    }
  }

  void _updateOtpValue() {
    String newValue = '';
    for (var controller in _controllers) {
      newValue += controller.text;
    }
    
    if (newValue != _otpValue) {
      setState(() {
        _otpValue = newValue;
      });
      widget.onChanged(newValue);
      
      // Auto-verify when all digits are filled
      if (newValue.length == widget.length && widget.onComplete != null) {
        widget.onComplete!();
      }
    }
  }

  void _clearAll() {
    for (var controller in _controllers) {
      controller.clear();
    }
    _focusNodes[0].requestFocus();
    _updateOtpValue();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final fillColor = widget.fillColor ?? theme.colorScheme.surface;
    final borderColor = widget.borderColor ?? theme.colorScheme.outline;
    final textColor = widget.textColor ?? theme.colorScheme.onSurface;
    final fontSize = widget.fontSize ?? 24.0;
    final width = widget.width ?? 50.0;
    final height = widget.height ?? 60.0;

    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: List.generate(
            widget.length,
            (index) => Container(
              width: width,
              height: height,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              child: RawKeyboardListener(
                focusNode: FocusNode(),
                onKey: (event) => _onKeyEvent(event, index),
                child: TextFormField(
                  controller: _controllers[index],
                  focusNode: _focusNodes[index],
                  enabled: widget.enabled,
                  textAlign: TextAlign.center,
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(1),
                  ],
                  style: TextStyle(
                    fontSize: fontSize,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: fillColor,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                        color: borderColor,
                        width: 1.5,
                      ),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                        color: borderColor,
                        width: 1.5,
                      ),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                        color: theme.colorScheme.primary,
                        width: 2.0,
                      ),
                    ),
                    errorBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                        color: theme.colorScheme.error,
                        width: 1.5,
                      ),
                    ),
                    focusedErrorBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                        color: theme.colorScheme.error,
                        width: 2.0,
                      ),
                    ),
                    contentPadding: EdgeInsets.zero,
                    counterText: '',
                  ),
                  onChanged: (value) => _onTextChanged(value, index),
                  validator: (value) {
                    if (widget.validator != null) {
                      return widget.validator!(_otpValue);
                    }
                    return null;
                  },
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        if (widget.enabled)
          TextButton(
            onPressed: _clearAll,
            child: Text(
              'Clear All',
              style: TextStyle(
                color: theme.colorScheme.primary,
                fontSize: 14,
              ),
            ),
          ),
      ],
    );
  }
}
