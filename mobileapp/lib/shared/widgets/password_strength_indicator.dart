import 'package:flutter/material.dart';

class PasswordStrengthIndicator extends StatelessWidget {
  final String password;
  final double width;

  const PasswordStrengthIndicator({
    super.key,
    required this.password,
    this.width = double.infinity,
  });

  @override
  Widget build(BuildContext context) {
    final strength = _calculateStrength(password);
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Progress bar
        Container(
          width: width,
          height: 4,
          decoration: BoxDecoration(
            color: Colors.grey[200],
            borderRadius: BorderRadius.circular(2),
          ),
          child: FractionallySizedBox(
            alignment: Alignment.centerLeft,
            widthFactor: strength['value'],
            child: Container(
              decoration: BoxDecoration(
                color: strength['color'],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
        ),
        
        const SizedBox(height: 8),
        
        // Strength text
        Text(
          strength['text'],
          style: TextStyle(
            fontSize: 12,
            color: strength['color'],
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Map<String, dynamic> _calculateStrength(String password) {
    if (password.isEmpty) {
      return {
        'value': 0.0,
        'color': Colors.grey,
        'text': 'Enter a password',
      };
    }

    int score = 0;
    List<String> feedback = [];

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.add('At least 8 characters');
    }

    // Lowercase check
    if (password.contains(RegExp(r'[a-z]'))) {
      score += 1;
    } else {
      feedback.add('Lowercase letter');
    }

    // Uppercase check
    if (password.contains(RegExp(r'[A-Z]'))) {
      score += 1;
    } else {
      feedback.add('Uppercase letter');
    }

    // Number check
    if (password.contains(RegExp(r'[0-9]'))) {
      score += 1;
    } else {
      feedback.add('Number');
    }

    // Special character check
    if (password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'))) {
      score += 1;
    } else {
      feedback.add('Special character');
    }

    // Determine strength level
    if (score <= 1) {
      return {
        'value': 0.2,
        'color': Colors.red,
        'text': 'Very Weak',
      };
    } else if (score == 2) {
      return {
        'value': 0.4,
        'color': Colors.orange,
        'text': 'Weak',
      };
    } else if (score == 3) {
      return {
        'value': 0.6,
        'color': Colors.yellow[700],
        'text': 'Fair',
      };
    } else if (score == 4) {
      return {
        'value': 0.8,
        'color': Colors.lightGreen,
        'text': 'Good',
      };
    } else {
      return {
        'value': 1.0,
        'color': Colors.green,
        'text': 'Strong',
      };
    }
  }
}
