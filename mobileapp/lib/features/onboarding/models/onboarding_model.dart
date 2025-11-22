class OnboardingModel {
  final String title;
  final String description;
  final String imagePath;
  final String? buttonText;
  final bool isLastPage;

  const OnboardingModel({
    required this.title,
    required this.description,
    required this.imagePath,
    this.buttonText,
    this.isLastPage = false,
  });
}

class OnboardingData {
  static List<OnboardingModel> get onboardingPages => [
    OnboardingModel(
      title: "Selamat Datang di\nNusa",
      description: "Temukan dan daftar event menarik\ndengan mudah di satu tempat",
      imagePath: "assets/images/onboarding/welcome.png",
    ),
    OnboardingModel(
      title: "Temukan Event\nTerbaik",
      description: "Jelajahi berbagai event menarik\ndari berbagai kategori dan lokasi",
      imagePath: "assets/images/onboarding/discover.png",
    ),
    OnboardingModel(
      title: "Daftar dengan\nMudah",
      description: "Daftar event favorit Anda\nhanya dengan beberapa tap",
      imagePath: "assets/images/onboarding/register.png",
    ),
    OnboardingModel(
      title: "Mulai Petualangan\nEvent Anda",
      description: "Siap untuk menemukan event\nmenarik dan bergabung dengan komunitas?",
      imagePath: "assets/images/onboarding/get_started.png",
      buttonText: "Mulai Sekarang",
      isLastPage: true,
    ),
  ];
}
