# Smart Back Navigation

Sistem navigasi cerdas yang mengingat history halaman yang dikunjungi user dan memberikan pengalaman navigasi yang lebih intuitif.

## Fitur

- **History Tracking**: Otomatis mencatat halaman yang dikunjungi user
- **Smart Back**: Kembali ke halaman sebelumnya yang benar-benar dikunjungi
- **Excluded Routes**: Halaman tertentu (splash, login, dll) tidak dicatat dalam history
- **Memory Management**: History dibatasi maksimal 20 halaman untuk mencegah memory leak
- **Fallback Navigation**: Jika tidak ada history, akan kembali ke home page

## Penggunaan

### 1. SmartBackButton

Gunakan untuk mengganti back button biasa di AppBar:

```dart
import '../../../shared/widgets/smart_back_button.dart';

AppBar(
  title: Text('My Page'),
  leading: SmartBackButton(), // Ganti IconButton biasa
)
```

### 2. SmartAppBar

AppBar yang sudah include smart back button:

```dart
import '../../../shared/widgets/smart_back_button.dart';

SmartAppBar(
  title: 'My Page',
  actions: [
    IconButton(icon: Icon(Icons.more_vert), onPressed: () {}),
  ],
)
```

### 3. SmartFloatingBackButton

Floating action button untuk back navigation:

```dart
import '../../../shared/widgets/smart_back_button.dart';

Scaffold(
  body: MyContent(),
  floatingActionButton: SmartFloatingBackButton(),
)
```

### 4. Extension Method

Gunakan extension method untuk smart back:

```dart
import '../../../core/navigation/navigation_history_manager.dart';

// Di dalam onPressed atau gesture detector
context.smartBack();

// Cek apakah bisa smart back
if (context.canSmartBack()) {
  context.smartBack();
} else {
  context.go('/home');
}
```

## Konfigurasi

### Excluded Routes

Halaman yang tidak dicatat dalam history (biasanya halaman auth dan splash):

```dart
final List<String> _excludedRoutes = [
  '/splash',
  '/onboarding',
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
];
```

### History Limit

History dibatasi maksimal 20 halaman untuk mencegah memory leak. Bisa diubah di `NavigationHistoryManager`:

```dart
if (_history.length > 20) {
  _history.removeAt(0);
}
```

## Debugging

Untuk melihat history navigation:

```dart
final historyManager = NavigationHistoryManager();
print('Current route: ${historyManager.getCurrentRoute()}');
print('Previous route: ${historyManager.getPreviousRoute()}');
print('Full history: ${historyManager.getHistory()}');
```

## Contoh Implementasi

### Halaman Detail Event

```dart
class EventDetailPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Event Detail'),
        leading: SmartBackButton(color: Colors.white),
      ),
      body: EventContent(),
    );
  }
}
```

### Halaman dengan Custom Back Logic

```dart
class MyPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('My Page'),
        leading: SmartBackButton(
          onPressed: () {
            // Custom logic sebelum back
            if (hasUnsavedChanges) {
              _showSaveDialog(context);
            } else {
              context.smartBack();
            }
          },
        ),
      ),
      body: MyContent(),
    );
  }
}
```

## Keuntungan

1. **User Experience**: User tidak akan tersesat saat navigasi
2. **Intuitive**: Back button bekerja sesuai ekspektasi user
3. **Memory Efficient**: History dibatasi untuk mencegah memory leak
4. **Flexible**: Bisa dikustomisasi sesuai kebutuhan
5. **Debug Friendly**: Mudah untuk debugging navigation flow
