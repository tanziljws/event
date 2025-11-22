class CurrencyFormatter {
  /// Format currency with proper thousand separators
  /// Example: 5000 -> "Rp 5,000", 150000 -> "Rp 150,000"
  static String formatCurrency(double amount) {
    if (amount == 0) return 'Rp 0';
    
    // Convert to integer to remove decimal places
    final intAmount = amount.toInt();
    
    // Add thousand separators
    final formatted = intAmount.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );
    
    return 'Rp $formatted';
  }
  
  /// Format currency without "Rp" prefix
  /// Example: 5000 -> "5,000", 150000 -> "150,000"
  static String formatAmount(double amount) {
    if (amount == 0) return '0';
    
    // Convert to integer to remove decimal places
    final intAmount = amount.toInt();
    
    // Add thousand separators
    final formatted = intAmount.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );
    
    return formatted;
  }
  
  /// Format currency for display in cards/widgets
  /// Example: 5000 -> "5,000", 150000 -> "150,000"
  static String formatForDisplay(double amount) {
    return formatAmount(amount);
  }
  
  /// Format currency for compact display (without Rp prefix)
  /// Example: 5000 -> "5K", 150000 -> "150K", 1500000 -> "1.5M"
  static String formatCompact(double amount) {
    if (amount == 0) return '0';
    
    if (amount >= 1000000) {
      return '${(amount / 1000000).toStringAsFixed(1)}M';
    } else if (amount >= 1000) {
      return '${(amount / 1000).toStringAsFixed(0)}K';
    } else {
      return amount.toInt().toString();
    }
  }
}
