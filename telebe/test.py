import json
import re

def clean_faculty_name(name):
    """Müqayisə zamanı xəta olmaması üçün fakültə adındakı lazımsız sözləri təmizləyir."""
    name = name.lower()
    for word in ["fakültəsi", "fakültə", "fakultəsi", "fakultə"]:
        name = name.replace(word, "")
    return name.strip()

def show_human_readable_menu(data):
    """Bütün universitet və fakültə adlarını tam oxunaqlı və ən kompakt şəkildə göstərir."""
    print("\n" + "="*60)
    print("MÖVCUD UNİVERSİTETLƏR VƏ FAKÜLTƏLƏR:")
    print("="*60)
    
    for uni_key, uni_data in data["universities"].items():
        # Universitet adını ekrana çıxarırıq
        print(f"\n{uni_data['name']}")
        
        for fac_key, fac_data in uni_data["faculties"].items():
            fac_name = fac_data['name']
            
            # Menuda qısa görünməsi üçün sözləri silirik
            fac_name = fac_name.replace("fakültəsi", "").replace("Fakültəsi", "")
            fac_name = fac_name.replace("fakültə", "").replace("Fakültə", "")
            fac_name = fac_name.replace("Fakultəsi", "").replace("Fakultə", "")
            fac_name = fac_name.strip()
            
            subjects = fac_data.get("assigned_subjects", [])
            subj_str = f" -> [Fənlər: {', '.join(subjects)}]" if subjects else ""
            
            print(f"{fac_name}{subj_str}")
            
    print("\n" + "="*60 + "\n")

# 1. JSON faylını oxuyuruq
file_name = 'subjects.json'
try:
    with open(file_name, 'r', encoding='utf-8') as file:
        data = json.load(file)
except FileNotFoundError:
    print(f"Xəta: {file_name} faylı tapılmadı!")
    exit()

# 2. Menunu tam sözlərlə göstəririk
show_human_readable_menu(data)

# 3. İstifadəçidən daxiletmələri alırıq
subject_name = input("1. Əlavə ediləcək fənnin adını yazın (məs: Ali Riyaziyyat): ").strip()

print("\n2. Universitetləri və mötərizədə fakültə adlarını yapışdırın.")
print("   Siyahını tam yapışdırdıqdan sonra, ən sonda yeni sətirdə sadəcə 'exit123' yazıb Enter basın:\n   > ", end="")

lines = []
while True:
    try:
        line = input()
        if line.strip().lower() == "exit123":
            break
        if line.strip():  # Boş sətirləri siyahıya əlavə etmirik
            lines.append(line.strip())
    except EOFError:
        break

print("\n--- Əlavə olunma prosesi başlayır ---\n")
total_success = 0

try:
    # Yapışdırılan hər bir sətiri (universiteti) tək-tək yoxlayırıq
    for user_input in lines:
        match = re.match(r"([^(]+)\s*\(([^)]+)\)", user_input)
        
        if match:
            input_uni_name = match.group(1).strip().lower()
            input_fac_names = [f.strip() for f in match.group(2).split(",")]
            
            uni_found = False
            
            # JSON-da yazılan adlarla istifadəçinin yazdığı adları müqayisə edirik
            for uni_key, uni_data in data["universities"].items():
                if uni_data["name"].strip().lower() == input_uni_name:
                    uni_found = True
                    
                    for input_fac in input_fac_names:
                        fac_found = False
                        
                        # Yapışdırılan fakültə adını təmizləyirik (məs: "tərcümə")
                        cleaned_input_fac = clean_faculty_name(input_fac)
                        
                        for fac_key, fac_data in uni_data["faculties"].items():
                            # JSON-dakı fakültə adını təmizləyirik (məs: "Tərcümə Fakültəsi" -> "tərcümə")
                            cleaned_json_fac = clean_faculty_name(fac_data["name"])
                            
                            if cleaned_json_fac == cleaned_input_fac:
                                fac_found = True
                                
                                # Fənn artıq əlavə edilibsə, təkrar əlavə etmirik
                                if subject_name not in fac_data["assigned_subjects"]:
                                    fac_data["assigned_subjects"].append(subject_name)
                                    print(f"✓ '{subject_name}' -> {uni_data['name']} / '{fac_data['name']}' fakültəsinə əlavə edildi.")
                                    total_success += 1
                                else:
                                    print(f"⚠ '{subject_name}' artıq {uni_data['name']} / '{fac_data['name']}' fakültəsində var.")
                                break
                        
                        if not fac_found:
                            print(f"✗ Xəta: '{uni_data['name']}' daxilində '{input_fac}' adlı fakültə tapılmadı!")
                    break
                    
            if not uni_found:
                print(f"✗ Xəta: Sistemdə '{input_uni_name}' adlı universitet tapılmadı!")
        else:
            print(f"✗ Daxiletmə formatı yanlışdır: {user_input}")

    # Sonda ən azı 1 uğurlu əlavə olubsa faylı yeniləyirik
    if total_success > 0:
        with open(file_name, 'w', encoding='utf-8') as file:
            json.dump(data, file, ensure_ascii=False, indent=2)
        print(f"\n| YEKUN: {total_success} yeni fənn əlaqəsi subjects.json faylına qeyd edildi! |")
        
        # Yenilənmiş siyahını təkrar göstəririk
        show_human_readable_menu(data)
    else:
        print("\n| YEKUN: Faylda heç bir dəyişiklik edilmədi. |")

except Exception as e:
    print(f"Gözlənilməz xəta baş verdi: {e}")