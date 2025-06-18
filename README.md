# Personel Ekleme Formu - Standart Kullanım

Bu proje, herhangi bir backend teknolojisi ile entegre edilebilecek standart bir personel ekleme formudur.

## Özellikler

### 🎨 Arayüz Özellikleri

- **Bootstrap 5** ile modern ve responsive tasarım
- **Font Awesome** ikonları
- Temiz ve kullanıcı dostu arayüz

### 📱 Form Özellikleri

- **Telefon numarası formatlaması**: Uluslararası telefon numarası desteği ile otomatik formatlama
- **Tarih formatlaması**: GG.AA.YYYY formatında otomatik tarih formatlaması
- **E-posta doğrulaması**: Gerçek zamanlı e-posta format kontrolü
- **Form doğrulaması**: Kapsamlı client-side doğrulama
- **AJAX form gönderimi**: Sayfa yenilenmeden form gönderimi

### 📋 Form Alanları

- **İsim Soyisim** (zorunlu)
- **E-posta** (zorunlu)
- **Telefon** (zorunlu) - Uluslararası format desteği
- **Doğum Tarihi** (opsiyonel) - GG.AA.YYYY formatı

## Dosya Yapısı

```
├── form_index.html      # Ana form dosyası
├── form_style.css       # Form stilleri
├── form_script.js       # JavaScript doğrulama ve formatlama
└── README.md           # Bu dosya
```

## Kullanım

### 1. Temel Kullanım

Formu doğrudan kullanmak için `form_index.html` dosyasını tarayıcıda açın.

### 2. Backend Entegrasyonu

#### Django için:

```html
<!-- form_index.html içinde action değerini güncelleyin -->
<form
  id="addPersonnelForm"
  method="post"
  action="{% url 'your_app:add_personnel' %}"
>
  {% csrf_token %}
  <!-- ... form alanları ... -->
</form>
```

#### Laravel için:

```html
<form
  id="addPersonnelForm"
  method="post"
  action="{{ route('personnel.store') }}"
>
  @csrf
  <!-- ... form alanları ... -->
</form>
```

#### Express.js için:

```javascript
// JavaScript bölümünde URL'i güncelleyin
FormValidator.initPersonnelForm({
  // ...
  url: "/api/personnel/add",
  // ...
});
```

### 3. Form Gönderimi Özelleştirme

Form gönderim davranışını özelleştirmek için:

```javascript
FormValidator.initPersonnelForm({
  formId: "addPersonnelForm",
  phoneField: "#id_phone",
  dateField: "#id_birth_date",
  alertContainerId: "add-personnel-alert-container",
  url: "/your-api-endpoint",
  resetFormOnSuccess: true,
  onSuccess: function (response) {
    // Başarı durumunda yapılacak işlemler
    console.log("Personel eklendi:", response);
    // Örnek: sayfa yönlendirme
    window.location.href = "/personnel/list";
  },
  onError: function (error) {
    // Hata durumunda yapılacak işlemler
    console.error("Hata:", error);
  },
});
```

## JavaScript Özellikleri

### Telefon Formatlaması

- **intl-tel-input** kütüphanesi kullanılır
- Türkiye varsayılan ülke
- Otomatik ülke algılama
- Gerçek zamanlı formatlama
- Ülke bayrağı seçici ile kolay ülke değiştirme

### Tarih Formatlaması

- GG.AA.YYYY formatında otomatik formatlama
- Sadece rakam girişi kabul edilir
- Otomatik nokta ekleme

### Form Doğrulaması

- Client-side doğrulama
- Sunucu hatalarını gösterme
- Görsel geri bildirim (hata/başarı durumları)

## CSS Sınıfları

Form özelleştirmesi için kullanılabilecek ana CSS sınıfları:

```css
.personnel-card          /* Ana kart container */
/* Ana kart container */
.form-group             /* Form grup container */
.form-control-soft      /* Yumuşak stil form elemanları */
.btn-soft-primary       /* Yumuşak stil birincil buton */
.btn-soft-secondary     /* Yumuşak stil ikincil buton */
.phone-input-container; /* Telefon input container */
```

## Bağımlılıklar

### CSS

- Bootstrap 5.3.3
- Font Awesome 6.5.2
- intl-tel-input 18.2.1

### JavaScript

- jQuery 3.7.1
- Bootstrap 5.3.3 JS
- intl-tel-input 18.2.1
- libphonenumber-js 1.11.4

## Tarayıcı Desteği

- Chrome (son 2 versiyon)
- Firefox (son 2 versiyon)
- Safari (son 2 versiyon)
- Edge (son 2 versiyon)

## Lisans

Bu proje açık kaynak kodludur ve MIT lisansı altında dağıtılmaktadır.
# new_person_form
