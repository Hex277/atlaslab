# Dövr vasitəsi ilə ekranda ulduzlardan ibarət düzbucaqlı üçbucaq 
# Piramida çap edən kod yazın.


while True:
    user = int(input("Daxil edin (Cixmaq ucun 1234)> "))
    if user == 1234:
        break
    for i in range(1, user+1):
        print("* "*i)
    
        
# 1 dən 50 yə qədər ədədləri dövr edin.
# 3ə bölünənlər Fizz
# 5ə bölünənlər Buzz
# həm 3 həmdə 5ə bölünənlər FizzBuzz

user = 50
my_list = []
for i in range(1, user+1):
    if i % 3 == 0 and i % 5 == 0:
       my_list.append("FizzBuzz")
    elif i % 3 == 0:
        my_list.append("Fizz")
    elif i % 5 == 0:
        my_list.append("Buzz")
    else:
        my_list.append(i)
for j in my_list:
    print(j)