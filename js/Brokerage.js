class BankingAccountEntry {
    BookingDate;
    ValutaDate;
    BookingText; // ???
    UsagePurposeText;
    AccountNumber;
    BLZ;
    AmountEUR;
    AccountReferenceText;
    MandateReferenceText;
    
    SenderName;
}

class DkbBankingAccountEntry extends BankingAccountEntry
{
    CreditorText;
    
    static parseFromText(text) {
        let instance = new this();
        let splitText = text.split(/\t/);
        instance.BookingDate = splitText[0];
        instance.ValutaDate = splitText[1];
        instance.BookingText = splitText[2];
        instance.SenderName = splitText[3];
        instance.UsagePurposeText = splitText[4];
        instance.AccountNumber = splitText[5];
        instance.BLZ = splitText[6];
        instance.AmountEUR = splitText[7];
        instance.CreditorText = splitText[8];
        instance.MandateReferenceText = splitText[9];
        instance.AccountReferenceText = splitText[10];
        
        return instance;
    }
}

