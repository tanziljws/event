import 'package:flutter/material.dart';
import '../../../shared/widgets/smart_back_button.dart';

class EditProfilePage extends StatelessWidget {
  const EditProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Profile'),
        leading: const SmartBackButton(),
      ),
      body: const Center(
        child: Text('Edit Profile Page - Coming Soon'),
      ),
    );
  }
}

